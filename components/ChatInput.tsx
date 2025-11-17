'use client';

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Assistant, SlashCommand } from '@/types';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  assistants: Assistant[];
  channelName: string;
  isDm?: boolean;
  dmAssistantId?: string;
  onSendMessage: (content: string, mentions: string[], command?: SlashCommand) => void;
}

interface CommandOption {
  command: SlashCommand;
  label: string;
  description: string;
  icon: string;
  assistants: Array<{ id: string; name: string }>; // Track all assistants that can handle this command
}

export function ChatInput({ assistants, channelName, isDm, dmAssistantId, onSendMessage }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCommand, setSelectedCommand] = useState<SlashCommand | undefined>();
  const [selectedCommandOption, setSelectedCommandOption] = useState<CommandOption | undefined>();
  const [selectedAgent, setSelectedAgent] = useState<{ id: string; name: string } | undefined>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get available commands based on assistants' capabilities
  const availableCommands: CommandOption[] = [];
  const commandToAssistantMap: Record<SlashCommand, string> = {} as any;

  // Helper to add command and accumulate assistants that can handle it
  const addCommand = (
    cmd: SlashCommand,
    label: string,
    description: string,
    icon: string,
    assistantId: string,
    assistantName: string
  ) => {
    const existingCommand = availableCommands.find(c => c.command === cmd);
    if (existingCommand) {
      // Command already exists, add this assistant to the list
      existingCommand.assistants.push({ id: assistantId, name: assistantName });
    } else {
      // New command, create it with this assistant
      availableCommands.push({
        command: cmd,
        label,
        description,
        icon,
        assistants: [{ id: assistantId, name: assistantName }]
      });
      commandToAssistantMap[cmd] = assistantId; // Keep for backward compatibility
    }
  };

  if (isDm && dmAssistantId) {
    // In DM: only show commands for the DM assistant
    const dmAssistant = assistants.find(a => a.id === dmAssistantId);
    if (dmAssistant) {
      if (dmAssistant.enable_image_generation) {
        addCommand('image', 'Generate Image', 'Create an image using gemini-2.5-flash-image', '🎨', dmAssistant.id, dmAssistant.name);
      }
      if (dmAssistant.enable_web_search) {
        addCommand('search', 'Search The Web', 'Search for real-time information online', '🔍', dmAssistant.id, dmAssistant.name);
      }
      if (dmAssistant.enable_deep_research) {
        addCommand('research', 'Conduct Deep Research', 'Use GPT-o3 for extended reasoning and analysis', '🧠', dmAssistant.id, dmAssistant.name);
      }
    }
  } else {
    // In regular channel: show commands from all assistants
    assistants.forEach(assistant => {
      if (assistant.enable_image_generation) {
        addCommand('image', 'Generate Image', `Ask ${assistant.name} to create an image`, '🎨', assistant.id, assistant.name);
      }
      if (assistant.enable_web_search) {
        addCommand('search', 'Search The Web', `Ask ${assistant.name} to search online`, '🔍', assistant.id, assistant.name);
      }
      if (assistant.enable_deep_research) {
        addCommand('research', 'Conduct Deep Research', `Ask ${assistant.name} for deep analysis`, '🧠', assistant.id, assistant.name);
      }
    });
  }

  // Reset selected index when dropdown opens
  useEffect(() => {
    if (showMentions || showCommands || showAgentSelector) {
      setSelectedIndex(0);
    }
  }, [showMentions, showCommands, showAgentSelector]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle keyboard navigation in command dropdown
    if (showCommands) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % availableCommands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + availableCommands.length) % availableCommands.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        selectCommand(availableCommands[selectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowCommands(false);
        setSelectedCommand(undefined);
        return;
      }
    }

    // Handle keyboard navigation in agent selector dropdown
    if (showAgentSelector && selectedCommandOption) {
      const availableAgents = selectedCommandOption.assistants;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % availableAgents.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + availableAgents.length) % availableAgents.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        selectAgent(availableAgents[selectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowAgentSelector(false);
        setSelectedCommand(undefined);
        setSelectedCommandOption(undefined);
        setSelectedAgent(undefined);
        return;
      }
    }

    // Handle keyboard navigation in mention dropdown
    if (showMentions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % assistants.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + assistants.length) % assistants.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        insertMention(assistants[selectedIndex].name);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentions(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }

    // Show command dropdown when / is typed at the start of message
    if (e.key === '/' && message.length === 0 && availableCommands.length > 0) {
      e.preventDefault();
      setMessage('/');
      setShowCommands(true);
    }

    // Show mention dropdown when @ is typed (and prevent default to avoid double @)
    if (e.key === '@' || (e.key === '2' && e.shiftKey)) {
      e.preventDefault();
      setMessage((prev) => prev + '@');
      setShowMentions(true);
    }
  };

  const selectCommand = (commandOption: CommandOption) => {
    setSelectedCommand(commandOption.command);
    setSelectedCommandOption(commandOption);
    setMessage('');
    setShowCommands(false);

    // Check if multiple assistants can handle this command
    if (commandOption.assistants.length > 1) {
      // Show agent selector
      setShowAgentSelector(true);
    } else {
      // Only one assistant, auto-select it
      setSelectedAgent(commandOption.assistants[0]);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  const selectAgent = (agent: { id: string; name: string }) => {
    setSelectedAgent(agent);
    setShowAgentSelector(false);

    // Show a visual indicator that a command is active
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleSend = () => {
    console.log('=== ChatInput handleSend called ===');
    console.log('Message:', message);
    console.log('Selected command:', selectedCommand);
    console.log('Message trimmed:', message.trim());
    console.log('Is DM:', isDm);
    console.log('DM Assistant ID:', dmAssistantId);
    console.log('Available assistants:', assistants);

    if (!message.trim()) {
      console.log('Message is empty, returning early');
      return;
    }

    let mentions: string[] = [];

    // In DM channels, automatically mention the assistant
    if (isDm && dmAssistantId) {
      console.log('DM channel detected, auto-mentioning assistant:', dmAssistantId);
      mentions = [dmAssistantId];
    } else {
      // Extract mentions - match @word pattern
      const mentionRegex = /@([a-zA-Z0-9_]+)/g;
      let match;

      console.log('Starting mention detection...');
      console.log('Testing regex on message:', message);

      while ((match = mentionRegex.exec(message)) !== null) {
        const mentionText = match[1].toLowerCase(); // e.g., "sales_assistant"
        console.log('✓ Found mention text:', mentionText);

        // Try to match against assistant names (converted to slug format)
        const assistant = assistants.find((a) => {
          const assistantSlug = a.name.toLowerCase().replace(/\s+/g, '_');
          console.log('  Comparing', mentionText, 'with', assistantSlug, 'from assistant:', a.name);
          return assistantSlug === mentionText || a.name.toLowerCase().includes(mentionText);
        });

        if (assistant) {
          console.log('✓ Matched assistant:', assistant.name, 'ID:', assistant.id);
          mentions.push(assistant.id);
        } else {
          console.log('✗ No assistant found for mention:', mentionText);
        }
      }

      // If a command was selected in regular channel, auto-mention the selected assistant for that command
      if (selectedCommand && selectedAgent) {
        if (!mentions.includes(selectedAgent.id)) {
          console.log('✓ Auto-mentioning assistant for command:', selectedCommand, selectedAgent.id, selectedAgent.name);
          mentions.push(selectedAgent.id);
        }
      }
    }

    console.log('=== Final mentions array:', mentions, '===');

    onSendMessage(message, mentions, selectedCommand);
    setMessage('');
    setShowMentions(false);
    setShowCommands(false);
    setShowAgentSelector(false);
    setSelectedCommand(undefined);
    setSelectedCommandOption(undefined);
    setSelectedAgent(undefined);
  };

  const insertMention = (assistantName: string) => {
    const formattedName = assistantName.toLowerCase().replace(/\s+/g, '_');
    setMessage((prev) => {
      // If the last character is @, replace it with the full mention
      // Otherwise just append the mention
      if (prev.endsWith('@')) {
        return prev.slice(0, -1) + `@${formattedName} `;
      }
      return prev + `@${formattedName} `;
    });
    setShowMentions(false);
  };

  return (
    <div className="border-t border-border bg-background-secondary p-4">
      <div className="relative">
        {/* Command dropdown */}
        {showCommands && availableCommands.length > 0 && (
          <div className="absolute bottom-full left-0 mb-2 w-80 bg-background-tertiary border border-border rounded-lg shadow-xl overflow-hidden">
            <div className="p-2 border-b border-border">
              <p className="text-xs text-foreground-tertiary font-semibold uppercase tracking-wide">
                Slash Commands
              </p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {availableCommands.map((cmd, index) => (
                <button
                  key={cmd.command}
                  onClick={() => selectCommand(cmd)}
                  className={cn(
                    "w-full flex items-start gap-3 px-3 py-2.5 transition-colors text-left",
                    index === selectedIndex
                      ? "bg-accent/20 border-l-2 border-accent"
                      : "hover:bg-background-secondary"
                  )}
                >
                  <div className="text-2xl mt-0.5">{cmd.icon}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">
                      /{cmd.command} - {cmd.label}
                    </div>
                    <div className="text-xs text-foreground-tertiary mt-0.5">
                      {cmd.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-2 border-t border-border bg-background-secondary/50">
              <p className="text-xs text-foreground-tertiary">
                <kbd className="px-1 py-0.5 bg-background-tertiary rounded border border-border">↑↓</kbd> to navigate ·{' '}
                <kbd className="px-1 py-0.5 bg-background-tertiary rounded border border-border">⏎</kbd> to select
              </p>
            </div>
          </div>
        )}

        {/* Agent selector dropdown */}
        {showAgentSelector && selectedCommandOption && (
          <div className="absolute bottom-full left-0 mb-2 w-80 bg-background-tertiary border border-border rounded-lg shadow-xl overflow-hidden">
            <div className="p-2 border-b border-border">
              <p className="text-xs text-foreground-tertiary font-semibold uppercase tracking-wide">
                Select Assistant for /{selectedCommandOption.command}
              </p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {selectedCommandOption.assistants.map((agent, index) => {
                const assistant = assistants.find(a => a.id === agent.id);
                return (
                  <button
                    key={agent.id}
                    onClick={() => selectAgent(agent)}
                    className={cn(
                      "w-full flex items-start gap-3 px-3 py-2.5 transition-colors text-left",
                      index === selectedIndex
                        ? "bg-accent/20 border-l-2 border-accent"
                        : "hover:bg-background-secondary"
                    )}
                  >
                    <div className="w-8 h-8 rounded bg-ai/20 border border-ai/30 flex items-center justify-center text-ai">
                      ◆
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">
                        {agent.name}
                      </div>
                      <div className="text-xs text-foreground-tertiary mt-0.5">
                        {assistant?.role || 'Assistant'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="p-2 border-t border-border bg-background-secondary/50">
              <p className="text-xs text-foreground-tertiary">
                <kbd className="px-1 py-0.5 bg-background-tertiary rounded border border-border">↑↓</kbd> to navigate ·{' '}
                <kbd className="px-1 py-0.5 bg-background-tertiary rounded border border-border">⏎</kbd> to select
              </p>
            </div>
          </div>
        )}

        {/* Mention dropdown */}
        {showMentions && (
          <div className="absolute bottom-full left-0 mb-2 w-64 bg-background-tertiary border border-border rounded-lg shadow-xl overflow-hidden">
            <div className="p-2 border-b border-border">
              <p className="text-xs text-foreground-tertiary font-semibold uppercase tracking-wide">
                Mention Assistant
              </p>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {assistants.map((assistant, index) => (
                <button
                  key={assistant.id}
                  onClick={() => insertMention(assistant.name)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 transition-colors text-left",
                    index === selectedIndex
                      ? "bg-accent/20 border-l-2 border-accent"
                      : "hover:bg-background-secondary"
                  )}
                >
                  <div className="w-6 h-6 rounded bg-ai/20 border border-ai/30 flex items-center justify-center text-ai text-xs">
                    ◆
                  </div>
                  <div>
                    <div className="text-sm text-foreground">
                      {assistant.name}
                    </div>
                    <div className="text-xs text-foreground-tertiary">
                      {assistant.role}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="relative">
          {/* Command indicator */}
          {selectedCommand && selectedAgent && (
            <div className="absolute -top-10 left-0 flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-lg px-3 py-1.5">
              <span className="text-sm font-medium text-accent">
                {selectedCommand === 'image' && '🎨 Generate Image'}
                {selectedCommand === 'search' && '🔍 Search The Web'}
                {selectedCommand === 'research' && '🧠 Conduct Deep Research'}
                {' via '}
                <span className="text-foreground">{selectedAgent.name}</span>
              </span>
              <button
                onClick={() => {
                  setSelectedCommand(undefined);
                  setSelectedCommandOption(undefined);
                  setSelectedAgent(undefined);
                }}
                className="text-accent hover:text-accent/70 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedCommand
                ? `Describe what you want to ${selectedCommand === 'image' ? 'generate' : selectedCommand === 'search' ? 'search for' : 'research'}...`
                : isDm
                  ? `Message ${channelName}...`
                  : `Message #${channelName} (use @assistant_name to mention)`
            }
            className={cn(
              'w-full bg-background border border-border rounded-lg px-4 py-3',
              'text-foreground placeholder:text-foreground-tertiary',
              'font-mono text-sm leading-relaxed',
              'resize-none focus:outline-none transition-colors',
              'min-h-[60px] max-h-[200px]',
              selectedCommand ? 'border-accent focus:border-accent' : 'focus:border-accent'
            )}
            rows={2}
          />

          {/* Send button */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className="text-xs text-foreground-tertiary">
              ⏎ to send · ⇧⏎ for new line
            </span>
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className={cn(
                'px-4 py-1.5 rounded-lg font-semibold text-sm transition-all',
                message.trim()
                  ? 'bg-accent text-background hover:bg-accent-hover'
                  : 'bg-background-tertiary text-foreground-tertiary cursor-not-allowed'
              )}
            >
              Send
            </button>
          </div>
        </div>

        {/* Helper text */}
        <div className="mt-2 flex items-center justify-between text-xs text-foreground-tertiary">
          <div className="flex items-center gap-3">
            {!isDm && (
              <>
                <span>
                  Type <kbd className="px-1.5 py-0.5 bg-background-tertiary rounded border border-border">@</kbd> to mention
                </span>
                {availableCommands.length > 0 && (
                  <span>
                    <kbd className="px-1.5 py-0.5 bg-background-tertiary rounded border border-border">/</kbd> for commands
                  </span>
                )}
              </>
            )}
            {isDm && (
              <>
                {availableCommands.length > 0 && (
                  <span>
                    Type <kbd className="px-1.5 py-0.5 bg-background-tertiary rounded border border-border">/</kbd> for commands
                  </span>
                )}
                <span>Direct message - responses are automatic</span>
              </>
            )}
          </div>
          <span>147 messages remaining this month</span>
        </div>
      </div>
    </div>
  );
}
