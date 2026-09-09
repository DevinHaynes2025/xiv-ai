export type InputChannel =
  | 'instructions'
  | 'data'
  | 'retrieved_documents'
  | 'user_content'
  | 'agent_messages'
  | 'tool_output';

export type IsolatedInput = {
  channel: InputChannel;
  text: string;
  trustedAsSystem: boolean;
  injectionRisk: 'none' | 'elevated' | 'high';
};

export function isolateAgentInput(channel: InputChannel, text: string): IsolatedInput {
  const untrusted =
    channel === 'data' ||
    channel === 'retrieved_documents' ||
    channel === 'user_content' ||
    channel === 'agent_messages' ||
    channel === 'tool_output';
  return {
    channel,
    text,
    trustedAsSystem: channel === 'instructions' && !untrusted,
    injectionRisk: untrusted ? 'elevated' : 'none',
  };
}

export function retrievedContentIsSystemInstruction(input: IsolatedInput) {
  return input.channel !== 'instructions' && input.trustedAsSystem;
}

export function treatAsSystemAuthority(channel: InputChannel) {
  return channel === 'instructions';
}
