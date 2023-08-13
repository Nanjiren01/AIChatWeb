import { SubmitKey } from "../store/config";
import type { PartialLocaleType } from "./index";

const jp: PartialLocaleType = {
  WIP: "この機能は開発中です",
  Error: {
    Unauthorized:
      "現在は未承認状態です。左下の設定ボタンをクリックし、アクセスパスワードかOpenAIのAPIキーを入力してください。",
  },
  Sidebar: {
    Title: "公告",
    Close: "关闭",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} 通のチャット`,
  },
  Chat: {
    SubTitle: (count: number) => `ChatGPTとの ${count} 通のチャット`,
    Actions: {
      ChatList: "メッセージリストを表示",
      CompressedHistory: "圧縮された履歴プロンプトを表示",
      Export: "チャット履歴をエクスポート",
      Copy: "コピー",
      Stop: "停止",
      Retry: "リトライ",
      Delete: "削除",
    },
    Rename: "チャットの名前を変更",
    Typing: "入力中…",
    SensitiveWordsTip: (question: string) =>
      `您的提问中包含敏感词：${question}`,
    BalanceNotEnough: "您的额度不足，请联系管理员",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} で送信`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += "，Shift + Enter で改行";
      }
      return inputHints + "，/ で自動補完をトリガー";
    },
    Send: "送信",
    Config: {
      Reset: "リセット",
      SaveAs: "另存为面具",
    },
  },
  Export: {
    Title: "チャット履歴をMarkdown形式でエクスポート",
    Copy: "すべてコピー",
    Download: "ファイルをダウンロード",
    MessageFromYou: "あなたからのメッセージ",
    MessageFromChatGPT: "ChatGPTからのメッセージ",
  },
  Memory: {
    Title: "履歴メモリ",
    EmptyContent: "まだ記憶されていません",
    Send: "メモリを送信",
    Copy: "メモリをコピー",
    Reset: "チャットをリセット",
    ResetConfirm:
      "リセット後、現在のチャット履歴と過去のメモリがクリアされます。リセットしてもよろしいですか？",
  },
  Home: {
    NewChat: "新しいチャット",
    DeleteChat: "選択したチャットを削除してもよろしいですか？",
    DeleteToast: "チャットが削除されました",
    Revert: "元に戻す",
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
    Title: "設定",
    SubTitle: "設定オプション",
    Danger: {
      Reset: {
        Title: "設定をリセット",
        SubTitle: "すべての設定項目をデフォルトにリセットします",
        Action: "今すぐリセットする",
        Confirm: "すべての設定項目をリセットしてもよろしいですか？",
      },
      Clear: {
        Title: "データを消去",
        SubTitle: "すべてのチャット履歴と設定を消去します",
        Action: "今すぐ消去する",
        Confirm: "すべてのチャット履歴と設定を消去しますか？",
      },
    },
    Lang: {
      Name: "Language", // ATTENTION: if you wanna add a new translation, please do not translate this value, leave it as `Language`
      All: "全ての言語",
    },
    Avatar: "アバター",
    FontSize: {
      Title: "フォントサイズ",
      SubTitle: "チャット内容のフォントサイズ",
    },
    InjectSystemPrompts: {
      Title: "システムプロンプトの挿入",
      SubTitle:
        "各リクエストのメッセージリストの先頭に、ChatGPTのシステムプロンプトを強制的に追加します",
    },
    InputTemplate: {
      Title: "入力の前処理",
      SubTitle: "新規入力がこのテンプレートに埋め込まれます",
    },
    Update: {
      Version: (x: string) => `現在のバージョン：${x}`,
      IsLatest: "最新バージョンです",
      CheckUpdate: "アップデートを確認",
      IsChecking: "アップデートを確認しています...",
      FoundUpdate: (x: string) => `新しいバージョンが見つかりました：${x}`,
      GoToUpdate: "更新する",
    },
    SendKey: "送信キー",
    Theme: "テーマ",
    TightBorder: "ボーダーレスモード",
    SendPreviewBubble: {
      Title: "プレビューバブルの送信",
      SubTitle: "プレビューバブルでマークダウンコンテンツをプレビュー",
    },
    Mask: {
      Splash: {
        Title: "キャラクターページ",
        SubTitle: "新規チャット作成時にキャラクターページを表示する",
      },
    },
    Prompt: {
      Disable: {
        Title: "プロンプトの自動補完を無効にする",
        SubTitle:
          "入力フィールドの先頭に / を入力すると、自動補完がトリガーされます。",
      },
      List: "カスタムプロンプトリスト",
      ListCount: (builtin: number, custom: number) =>
        `組み込み ${builtin} 件、ユーザー定義 ${custom} 件`,
      Edit: "編集",
      Modal: {
        Title: "プロンプトリスト",
        Add: "新規追加",
        Search: "プロンプトワード検索",
      },
      EditModal: {
        Title: "編集",
      },
    },
    HistoryCount: {
      Title: "履歴メッセージ数を添付",
      SubTitle: "リクエストごとに添付する履歴メッセージ数",
    },
    CompressThreshold: {
      Title: "履歴メッセージの長さ圧縮しきい値",
      SubTitle:
        "圧縮されていない履歴メッセージがこの値を超えた場合、圧縮が行われます。",
    },
    Token: {
      Title: "APIキー",
      SubTitle: "自分のキーを使用してパスワードアクセス制限を迂回する",
      Placeholder: "OpenAI APIキー",
    },
    Usage: {
      Title: "残高照会",
      SubTitle(used: any, total: any) {
        return `今月は $${used} を使用しました。総額は $${total} です。`;
      },
      IsChecking: "確認中...",
      Check: "再確認",
      NoAccess: "APIキーまたはアクセスパスワードを入力して残高を表示",
    },
    AccessCode: {
      Title: "アクセスパスワード",
      SubTitle: "暗号化アクセスが有効になっています",
      Placeholder: "アクセスパスワードを入力してください",
    },
    Model: "モデル (model)",
    Temperature: {
      Title: "ランダム性 (temperature)",
      SubTitle:
        "値が大きいほど、回答がランダムになります。1以上の値には文字化けが含まれる可能性があります。",
    },
    MaxTokens: {
      Title: "シングルレスポンス制限 (max_tokens)",
      SubTitle: "1回のインタラクションで使用される最大トークン数",
    },
    PresencePenalty: {
      Title: "トピックの新鮮度 (presence_penalty)",
      SubTitle: "値が大きいほど、新しいトピックへの展開が可能になります。",
    },
    FrequencyPenalty: {
      Title: "話題の頻度 (frequency_penalty)",
      SubTitle: "値が大きいほど、重複語を低減する可能性が高くなります",
    },
  },
  Store: {
    DefaultTopic: "新しいチャット",
    BotHello: "何かお手伝いできることはありますか",
    Error: "エラーが発生しました。しばらくしてからやり直してください。",
    Prompt: {
      History: (content: string) =>
        "これは、AI とユーザの過去のチャットを要約した前提となるストーリーです：" +
        content,
      Topic:
        "4～5文字でこの文章の簡潔な主題を返してください。説明、句読点、感嘆詞、余分なテキストは無しで。もし主題がない場合は、「おしゃべり」を返してください",
      Summarize:
        "あなたとユーザの会話を簡潔にまとめて、後続のコンテキストプロンプトとして使ってください。200字以内に抑えてください。",
    },
  },
  Copy: {
    Success: "クリップボードに書き込みました",
    Failed: "コピーに失敗しました。クリップボード許可を与えてください。",
  },
  Context: {
    Toast: (x: any) => `キャラクターが ${x} 件設定されました`,
    Edit: "キャラクタープリセットとモデル設定",
    Add: "追加",
  },
  Plugin: { Name: "プラグイン" },
  Mask: {
    Name: "キャラクタープリセット",
    Page: {
      Title: "キャラクタープリセット",
      SubTitle: (count: number) => `${count} 件見つかりました。`,
      Search: "検索",
      Create: "新規",
    },
    Item: {
      Info: (count: number) => `包含 ${count} 条预设对话`,
      Chat: "会話",
      View: "詳細",
      Edit: "編集",
      Delete: "削除",
      DeleteConfirm: "本当に削除しますか？",
    },
    EditModal: {
      Title: (readonly: boolean) =>
        `キャラクタープリセットを編集 ${readonly ? "（読み取り専用）" : ""}`,
      Download: "ダウンロード",
      Clone: "複製",
    },
    Config: {
      Avatar: "キャラクターのアイコン",
      Name: "キャラクターの名前",
      Sync: {
        Title: "グローバル設定を利用する",
        SubTitle: "このチャットでグローバル設定を利用します。",
        Confirm:
          "カスタム設定を上書きしてグローバル設定を使用します、よろしいですか？",
      },
      HideContext: {
        Title: "キャラクター設定を表示しない",
        SubTitle: "チャット画面でのキャラクター設定を非表示にします。",
      },
    },
  },
  NewChat: {
    Return: "戻る",
    Skip: "スキップ",
    Title: "キャラクター",
    SubTitle: "さあ、AIにキャラクターを設定して会話を始めてみましょう",
    More: "もっと探す",
    NotShow: "今後は表示しない",
    ConfirmNoShow: "いつでも設定から有効化できます。",
  },

  UI: {
    Confirm: "確認",
    Cancel: "キャンセル",
    Close: "閉じる",
    Create: "新規",
    Edit: "編集",
  },
  Exporter: {
    Model: "モデル",
    Messages: "メッセージ",
    Topic: "トピック",
    Time: "時間",
  },
};

export default jp;
