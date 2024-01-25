import EmojiPicker, {
  Emoji,
  EmojiStyle,
  Theme as EmojiTheme,
} from "emoji-picker-react";

import { ModelType, useWebsiteConfigStore } from "../store";

import BotIcon from "../icons/ai-chat-bot.png";
import BlackBotIcon from "../icons/ai-chat-bot.png"; // 暂时都一样
import NextImage from "next/image";

export function getEmojiUrl(unified: string, style: EmojiStyle) {
  return `/emoji-date-apple-img-64-15.0.1/${unified}.png`; // /${style}/64
}

export function AvatarPicker(props: {
  onEmojiClick: (emojiId: string) => void;
}) {
  return (
    <EmojiPicker
      lazyLoadEmojis
      theme={EmojiTheme.AUTO}
      getEmojiUrl={getEmojiUrl}
      onEmojiClick={(e) => {
        props.onEmojiClick(e.unified);
      }}
    />
  );
}

export function Avatar(props: {
  model?: ModelType;
  avatar?: string;
  logoUrl?: string;
  inline?: boolean;
  noBorder?: boolean;
}) {
  // console.log('refresh Avatar', props.logoUrl)
  if (props.model) {
    // 如果提供了模型名称，那么检查模型名称是不是gpt-4开头，如果是，那么展示aichat默认高级黑icon
    // 否则展示logo，当然，如果logo没有在后台上传，那么展示aichat默认icon
    // 仅MaskAvatar传入了model参数
    const logoUrl = props.logoUrl;
    return (
      <div className="no-dark">
        {props.model?.startsWith("gpt-4") ? (
          <NextImage
            src={BlackBotIcon.src}
            width={30}
            height={30}
            alt="bot"
            className={`user-avatar ${props.noBorder ? "no-border" : ""}`}
          />
        ) : logoUrl !== undefined && logoUrl !== null && logoUrl !== "" ? (
          <img src={logoUrl} width={30} height={30} />
        ) : (
          <NextImage
            src={BotIcon.src}
            width={30}
            height={30}
            alt="bot"
            className={`user-avatar ${props.noBorder ? "no-border" : ""}`}
          />
        )}
      </div>
    );
  }

  return props.avatar ? (
    props.inline ? (
      <span style={{ display: props.inline ? "inline-block" : "" }}>
        <span className={`user-avatar ${props.noBorder ? "no-border" : ""}`}>
          <EmojiAvatar avatar={props.avatar} />
        </span>
      </span>
    ) : (
      <div className={`user-avatar ${props.noBorder ? "no-border" : ""}`}>
        <EmojiAvatar avatar={props.avatar} />
      </div>
    )
  ) : (
    <img
      src={props.logoUrl}
      width={30}
      height={30}
      style={{ display: props.inline ? "inline-block" : "" }}
    />
  );
}

export function EmojiAvatar(props: { avatar: string; size?: number }) {
  return (
    <Emoji
      unified={props.avatar}
      size={props.size ?? 18}
      getEmojiUrl={getEmojiUrl}
    />
  );
}
