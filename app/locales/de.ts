import { SubmitKey } from "../store/config";
import type { PartialLocaleType } from "./index";

const de: PartialLocaleType = {
  WIP: "In Bearbeitung...",
  Error: {
    Unauthorized:
      "Unbefugter Zugriff, bitte geben Sie den Zugangscode auf der Einstellungsseite ein.",
  },
  Sidebar: {
    Title: "公告",
    Close: "关闭",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} Nachrichten`,
  },
  Chat: {
    SubTitle: (count: number) => `${count} Nachrichten mit ChatGPT`,
    Actions: {
      ChatList: "Zur Chat-Liste gehen",
      CompressedHistory: "Komprimierter Gedächtnis-Prompt",
      Export: "Alle Nachrichten als Markdown exportieren",
      Copy: "Kopieren",
      Stop: "Stop",
      Retry: "Wiederholen",
      Delete: "Delete",
    },
    Rename: "Chat umbenennen",
    Typing: "Tippen...",
    SensitiveWordsTip: (question: string) =>
      `您的提问中包含敏感词：${question}`,
    BalanceNotEnough: "您的额度不足，请联系管理员",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} um zu Senden`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += ", Umschalt + Eingabe für Zeilenumbruch";
      }
      return inputHints + ", / zum Durchsuchen von Prompts";
    },
    Send: "Senden",
    Config: {
      Reset: "Reset to Default",
      SaveAs: "Save as Mask",
    },
  },
  Export: {
    Title: "Alle Nachrichten",
    Copy: "Alles kopieren",
    Download: "Herunterladen",
    MessageFromYou: "Deine Nachricht",
    MessageFromChatGPT: "Nachricht von ChatGPT",
  },
  Memory: {
    Title: "Gedächtnis-Prompt",
    EmptyContent: "Noch nichts.",
    Send: "Gedächtnis senden",
    Copy: "Gedächtnis kopieren",
    Reset: "Sitzung zurücksetzen",
    ResetConfirm:
      "Das Zurücksetzen löscht den aktuellen Gesprächsverlauf und das Langzeit-Gedächtnis. Möchten Sie wirklich zurücksetzen?",
  },
  Home: {
    NewChat: "Neuer Chat",
    DeleteChat: "Bestätigen Sie, um das ausgewählte Gespräch zu löschen?",
    DeleteToast: "Chat gelöscht",
    Revert: "Zurücksetzen",
    NoNotice: "暂无公告",
  },
  LoginPage: {
    Title: "登录",
    SubTitle: "登录后可跟AI交流",
    Username: {
      Title: "用户名",
      SubTitle: "",
      Placeholder: "请输入用户名",
    },
    Password: {
      Title: "密码",
      SubTitle: "",
      Placeholder: "请输入密码",
    },
    Actions: {
      Close: "关闭",
      Login: "登录",
      Logout: "退出登录",
    },
    Toast: {
      Success: "登录成功",
      Logining: "登录中……",
    },
    GoToRegister: "前往注册",
  },
  RegisterPage: {
    Title: "注册",
    SubTitle: "注册后赠送免费额度哦",
    Name: {
      Title: "昵称",
      SubTitle: "",
      Placeholder: "请输入昵称，可不填",
    },
    Email: {
      Title: "邮箱",
      SubTitle: "",
      Placeholder: "请输入邮箱",
    },
    EmailCode: {
      Title: "验证码",
      SubTitle: "系统将向您邮箱发送的验证码",
      Placeholder: "请输入验证码",
    },
    Username: {
      Title: "用户名",
      SubTitle: "",
      Placeholder: "请输入用户名",
    },
    Password: {
      Title: "密码",
      SubTitle: "",
      Placeholder: "请输入密码",
    },
    ConfirmedPassword: {
      Title: "确认密码",
      SubTitle: "",
      Placeholder: "请再次输入密码",
    },
    Actions: {
      Close: "关闭",
    },
    Toast: {
      Success: "注册成功，正在前往聊天……",
      Registering: "注册中……",
      Failed: "注册失败！",
      FailedWithReason: "注册失败！原因：",
      PasswordNotTheSame: "两次输入的密码不一致！",
      PasswordEmpty: "密码不能为空！",
      SendEmailCode: "发送验证码",
      EmailCodeSending: "验证码发送中",
      EmailCodeSent: "验证码已发送，请查看邮箱",
      EmailIsEmpty: "请输入邮箱",
      EmailCodeSentFrequently: "验证码发送过于频繁，请稍后再试",
      EmailFormatError: "邮箱格式不正确",
      EmailCodeEmpty: "请输入邮箱验证码",
      EmailExistsError: "该邮箱已注册",
    },
    GoToLogin: "前往登录",
    Captcha: "",
    CaptchaTitle: "点击刷新验证码",
    CaptchaIsEmpty: "请输入图形验证码",
    CaptchaLengthError: "图形验证码长度不正确",
    CaptchaInput: {
      Title: "图形验证码",
      SubTitle: "",
      Placeholder: "请输入图中的验证码",
    },
  },
  Profile: {
    Title: "个人中心",
    SubTitle: "个人中心",
    Username: "账号",
    Tokens: {
      Title: "tokens",
      SubTitle: "剩余tokens数量",
    },
    ChatCount: {
      Title: "询问次数",
      SubTitle: "剩余询问次数（GPT3.5等）",
    },
    AdvanceChatCount: {
      Title: "询问次数（GPT4）",
      SubTitle: "聊天询问次数（GPT4）",
    },
    DrawCount: {
      Title: "绘图次数",
      SubTitle: "剩余绘图次数",
    },
    Actions: {
      Close: "关闭",
      Pricing: "购买套餐",
      GoToBalanceList: "更多",
      ConsultAdministrator: "请咨询站长",
      All: "所有套餐",
    },
    BalanceItem: {
      Title: "套餐类型",
      SubTitle: "",
      CalcTypes: {
        Total: "总额",
        Daily: "每天",
        Hourly: "每小时",
        ThreeHourly: "每3小时",
      },
    },
    ExpireList: {
      Title: "过期时间",
      SubTitle: "",
    },
  },
  PricingPage: {
    Title: "充值",
    SubTitle: "畅享与AI聊天的乐趣",
    Actions: {
      Close: "关闭",
      Buy: " 购 买 ",
    },
    NoPackage: "暂无可用套餐",
    ConsultAdministrator: "请咨询站长",
  },
  Settings: {
    Title: "Einstellungen",
    SubTitle: "Alle Einstellungen",

    Lang: {
      Name: "Language", // ATTENTION: if you wanna add a new translation, please do not translate this value, leave it as `Language`
      All: "Alle Sprachen",
    },
    Avatar: "Avatar",
    FontSize: {
      Title: "Schriftgröße",
      SubTitle: "Schriftgröße des Chat-Inhalts anpassen",
    },
    Update: {
      Version: (x: string) => `Version: ${x}`,
      IsLatest: "Neueste Version",
      CheckUpdate: "Update prüfen",
      IsChecking: "Update wird geprüft...",
      FoundUpdate: (x: string) => `Neue Version gefunden: ${x}`,
      GoToUpdate: "Aktualisieren",
    },
    SendKey: "Senden-Taste",
    Theme: "Erscheinungsbild",
    TightBorder: "Enger Rahmen",
    SendPreviewBubble: {
      Title: "Vorschau-Bubble senden",
      SubTitle: "Preview markdown in bubble",
    },
    Mask: {
      Title: "Mask Splash Screen",
      SubTitle: "Show a mask splash screen before starting new chat",
    },
    Prompt: {
      Disable: {
        Title: "Autovervollständigung deaktivieren",
        SubTitle: "Autovervollständigung mit / starten",
      },
      List: "Prompt-Liste",
      ListCount: (builtin: number, custom: number) =>
        `${builtin} integriert, ${custom} benutzerdefiniert`,
      Edit: "Bearbeiten",
      Modal: {
        Title: "Prompt List",
        Add: "Add One",
        Search: "Search Prompts",
      },
      EditModal: {
        Title: "Edit Prompt",
      },
    },
    HistoryCount: {
      Title: "Anzahl der angehängten Nachrichten",
      SubTitle: "Anzahl der pro Anfrage angehängten gesendeten Nachrichten",
    },
    CompressThreshold: {
      Title: "Schwellenwert für Verlaufskomprimierung",
      SubTitle:
        "Komprimierung, wenn die Länge der unkomprimierten Nachrichten den Wert überschreitet",
    },
    Token: {
      Title: "API-Schlüssel",
      SubTitle:
        "Verwenden Sie Ihren Schlüssel, um das Zugangscode-Limit zu ignorieren",
      Placeholder: "OpenAI API-Schlüssel",
    },
    Usage: {
      Title: "Kontostand",
      SubTitle(used: any, total: any) {
        return `Diesen Monat ausgegeben $${used}, Abonnement $${total}`;
      },
      IsChecking: "Wird überprüft...",
      Check: "Erneut prüfen",
      NoAccess: "API-Schlüssel eingeben, um den Kontostand zu überprüfen",
    },
    AccessCode: {
      Title: "Zugangscode",
      SubTitle: "Zugangskontrolle aktiviert",
      Placeholder: "Zugangscode erforderlich",
    },
    Model: "Modell",
    Temperature: {
      Title: "Temperature", //Temperatur
      SubTitle: "Ein größerer Wert führt zu zufälligeren Antworten",
    },
    MaxTokens: {
      Title: "Max Tokens", //Maximale Token
      SubTitle: "Maximale Anzahl der Anfrage- plus Antwort-Token",
    },
    PresencePenalty: {
      Title: "Presence Penalty", //Anwesenheitsstrafe
      SubTitle:
        "Ein größerer Wert erhöht die Wahrscheinlichkeit, dass über neue Themen gesprochen wird",
    },
    FrequencyPenalty: {
      Title: "Frequency Penalty", // HäufigkeitStrafe
      SubTitle:
        "Ein größerer Wert, der die Wahrscheinlichkeit verringert, dass dieselbe Zeile wiederholt wird",
    },
  },
  Store: {
    DefaultTopic: "Neues Gespräch",
    BotHello: "Hallo! Wie kann ich Ihnen heute helfen?",
    Error:
      "Etwas ist schief gelaufen, bitte versuchen Sie es später noch einmal.",
    Prompt: {
      History: (content: string) =>
        "Dies ist eine Zusammenfassung des Chatverlaufs zwischen dem KI und dem Benutzer als Rückblick: " +
        content,
      Topic:
        "Bitte erstellen Sie einen vier- bis fünfwörtigen Titel, der unser Gespräch zusammenfasst, ohne Einleitung, Zeichensetzung, Anführungszeichen, Punkte, Symbole oder zusätzlichen Text. Entfernen Sie Anführungszeichen.",
      Summarize:
        "Fassen Sie unsere Diskussion kurz in 200 Wörtern oder weniger zusammen, um sie als Pronpt für zukünftige Gespräche zu verwenden.",
    },
  },
  Copy: {
    Success: "In die Zwischenablage kopiert",
    Failed:
      "Kopieren fehlgeschlagen, bitte geben Sie die Berechtigung zum Zugriff auf die Zwischenablage frei",
  },
  Context: {
    Toast: (x: any) => `Mit ${x} Kontext-Prompts`,
    Edit: "Kontext- und Gedächtnis-Prompts",
    Add: "Hinzufügen",
  },
  Plugin: {
    Name: "Plugin",
  },
  Mask: {
    Name: "Mask",
    Page: {
      Title: "Prompt Template",
      SubTitle: (count: number) => `${count} prompt templates`,
      Search: "Search Templates",
      Create: "Create",
    },
    Item: {
      Info: (count: number) => `${count} prompts`,
      Chat: "Chat",
      View: "View",
      Edit: "Edit",
      Delete: "Delete",
      DeleteConfirm: "Confirm to delete?",
    },
    EditModal: {
      Title: (readonly: boolean) =>
        `Edit Prompt Template ${readonly ? "(readonly)" : ""}`,
      Download: "Download",
      Clone: "Clone",
    },
    Config: {
      Avatar: "Bot Avatar",
      Name: "Bot Name",
    },
  },
  NewChat: {
    Return: "Return",
    Skip: "Skip",
    Title: "Pick a Mask",
    SubTitle: "Chat with the Soul behind the Mask",
    More: "Find More",
    NotShow: "Not Show Again",
    ConfirmNoShow: "Confirm to disable？You can enable it in settings later.",
  },

  UI: {
    Confirm: "Confirm",
    Cancel: "Cancel",
    Close: "Close",
    Create: "Create",
    Edit: "Edit",
  },
  Exporter: {
    Model: "Modell",
    Messages: "Nachrichten",
    Topic: "Thema",
    Time: "Zeit",
  },
};

export default de;
