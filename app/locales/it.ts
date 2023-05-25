import { SubmitKey } from "../store/config";
import type { LocaleType } from "./index";

const it: LocaleType = {
  WIP: "Work in progress...",
  Error: {
    Unauthorized:
      "Accesso non autorizzato, inserire il codice di accesso nella pagina delle impostazioni.",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} messaggi`,
  },
  Chat: {
    SubTitle: (count: number) => `${count} messaggi con ChatGPT`,
    Actions: {
      ChatList: "Vai alla Chat List",
      CompressedHistory: "Prompt di memoria della cronologia compressa",
      Export: "Esportazione di tutti i messaggi come Markdown",
      Copy: "Copia",
      Stop: "Stop",
      Retry: "Riprova",
      Delete: "Delete",
    },
    Rename: "Rinomina Chat",
    Typing: "Typing…",
    Input: (submitKey: string) => {
      var inputHints = `Scrivi qualcosa e premi ${submitKey} per inviare`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += ", premi Shift + Enter per andare a capo";
      }
      return inputHints;
    },
    Send: "Invia",
    Config: {
      Reset: "Reset to Default",
      SaveAs: "Save as Mask",
    },
  },
  Export: {
    Title: "Tutti i messaggi",
    Copy: "Copia tutto",
    Download: "Scarica",
    MessageFromYou: "Messaggio da te",
    MessageFromChatGPT: "Messaggio da ChatGPT",
  },
  Memory: {
    Title: "Prompt di memoria",
    EmptyContent: "Vuoto.",
    Copy: "Copia tutto",
    Send: "Send Memory",
    Reset: "Reset Session",
    ResetConfirm:
      "Ripristinare cancellerà la conversazione corrente e la cronologia di memoria. Sei sicuro che vuoi riavviare?",
  },
  Home: {
    NewChat: "Nuova Chat",
    DeleteChat: "Confermare la cancellazione della conversazione selezionata?",
    DeleteToast: "Chat Cancellata",
    Revert: "Revert",
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
    },
  },
  Settings: {
    Title: "Impostazioni",
    SubTitle: "Tutte le impostazioni",
    Actions: {
      ClearAll: "Cancella tutti i dati",
      ResetAll: "Resetta tutte le impostazioni",
      Close: "Chiudi",
      ConfirmResetAll: "Sei sicuro vuoi cancellare tutte le impostazioni?",
      ConfirmClearAll: "Sei sicuro vuoi cancellare tutte le chat?",
    },
    Lang: {
      Name: "Lingue",
      All: "All Languages",
      Options: {
        cn: "简体中文",
        en: "English",
        tw: "繁體中文",
        es: "Español",
        it: "Italiano",
        tr: "Türkçe",
        jp: "日本語",
        de: "Deutsch",
        vi: "Vietnamese",
      },
    },
    Avatar: "Avatar",
    FontSize: {
      Title: "Dimensione carattere",
      SubTitle: "Regolare la dimensione dei caratteri del contenuto della chat",
    },
    Update: {
      Version: (x: string) => `Versione: ${x}`,
      IsLatest: "Ultima versione",
      CheckUpdate: "Controlla aggiornamenti",
      IsChecking: "Sto controllando gli aggiornamenti...",
      FoundUpdate: (x: string) => `Trovata nuova versione: ${x}`,
      GoToUpdate: "Aggiorna",
    },
    SendKey: "Tasto invia",
    Theme: "Tema",
    TightBorder: "Schermo intero",
    SendPreviewBubble: {
      Title: "Anteprima di digitazione",
      SubTitle: "Preview markdown in bubble",
    },
    Mask: {
      Title: "Mask Splash Screen",
      SubTitle: "Show a mask splash screen before starting new chat",
    },
    Prompt: {
      Disable: {
        Title: "Disabilita l'auto completamento",
        SubTitle: "Input / per attivare il completamento automatico",
      },
      List: "Elenco dei suggerimenti",
      ListCount: (builtin: number, custom: number) =>
        `${builtin} built-in, ${custom} user-defined`,
      Edit: "Modifica",
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
      Title: "Conteggio dei messaggi allegati",
      SubTitle: "Numero di messaggi inviati allegati per richiesta",
    },
    CompressThreshold: {
      Title: "Soglia di compressione della cronologia",
      SubTitle:
        "Comprimerà se la lunghezza dei messaggi non compressi supera il valore",
    },
    Token: {
      Title: "API Key",
      SubTitle:
        "Utilizzare la chiave per ignorare il limite del codice di accesso",
      Placeholder: "OpenAI API Key",
    },
    Usage: {
      Title: "Bilancio Account",
      SubTitle(used: any, total: any) {
        return `Attualmente usato in questo mese $${used}, soglia massima $${total}`;
      },
      IsChecking: "Controllando...",
      Check: "Controlla ancora",
      NoAccess: "Inserire la chiave API per controllare il saldo",
    },
    AccessCode: {
      Title: "Codice d'accesso",
      SubTitle: "Controllo d'accesso abilitato",
      Placeholder: "Inserisci il codice d'accesso",
    },
    Model: "Modello GPT",
    Temperature: {
      Title: "Temperature",
      SubTitle: "Un valore maggiore rende l'output più casuale",
    },
    MaxTokens: {
      Title: "Token massimi",
      SubTitle: "Lunghezza massima dei token in ingresso e dei token generati",
    },
    PresencePenlty: {
      Title: "Penalità di presenza",
      SubTitle:
        "Un valore maggiore aumenta la probabilità di parlare di nuovi argomenti",
    },
  },
  Store: {
    DefaultTopic: "Nuova conversazione",
    BotHello: "Ciao, come posso aiutarti oggi?",
    Error: "Qualcosa è andato storto, riprova più tardi.",
    Prompt: {
      History: (content: string) =>
        "Questo è un riassunto della cronologia delle chat tra l'IA e l'utente:" +
        content,
      Topic:
        "Si prega di generare un titolo di quattro o cinque parole che riassuma la nostra conversazione senza alcuna traccia, punteggiatura, virgolette, punti, simboli o testo aggiuntivo. Rimuovere le virgolette",
      Summarize:
        "Riassumi brevemente la nostra discussione in 200 caratteri o meno per usarla come spunto per una futura conversazione.",
    },
  },
  Copy: {
    Success: "Copiato sugli appunti",
    Failed:
      "Copia fallita, concedere l'autorizzazione all'accesso agli appunti",
  },
  Context: {
    Toast: (x: any) => `Con ${x} prompts contestuali`,
    Edit: "Prompt contestuali e di memoria",
    Add: "Aggiungi altro",
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
};

export default it;
