export interface InboundMessage {
  sender_id: string;
  phone?: string;
  handle?: string;
  text: string;
  channel_ref?: string;
}

export interface ChannelAdapter {
  name: string;
  parseInbound(req: Request): Promise<InboundMessage | null>;
  sendReply(to: string, text: string): Promise<void>;
}
