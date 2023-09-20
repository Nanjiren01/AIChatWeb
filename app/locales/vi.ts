import { SubmitKey } from "../store/config";
import type { PartialLocaleType } from "./index";

const vi: PartialLocaleType = {
  WIP: "Sắp ra mắt...",
  Error: {
    Unauthorized:
      "Truy cập chưa xác thực, vui lòng nhập mã truy cập trong trang cài đặt.",
  },
  Sidebar: {
    Title: "公告",
    Close: "关闭",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} tin nhắn`,
  },
  Chat: {
    SubTitle: (count: number) => `${count} tin nhắn với ChatGPT`,
    Actions: {
      ChatList: "Xem danh sách chat",
      CompressedHistory: "Nén tin nhắn trong quá khứ",
      Export: "Xuất tất cả tin nhắn dưới dạng Markdown",
      Copy: "Sao chép",
      Stop: "Dừng",
      Retry: "Thử lại",
      Delete: "Xóa",
    },
    Rename: "Đổi tên",
    Typing: "Đang nhập…",
    SensitiveWordsTip: (question: string) =>
      `您的提问中包含敏感词：${question}`,
    BalanceNotEnough: "您的额度不足，请联系管理员",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} để gửi`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += ", Shift + Enter để xuống dòng";
      }
      return inputHints + ", / để tìm kiếm mẫu gợi ý";
    },
    Send: "Gửi",
    Config: {
      Reset: "Khôi phục cài đặt gốc",
      SaveAs: "Lưu dưới dạng Mẫu",
    },
  },
  Export: {
    Title: "Tất cả tin nhắn",
    Copy: "Sao chép tất cả",
    Download: "Tải xuống",
    MessageFromYou: "Tin nhắn của bạn",
    MessageFromChatGPT: "Tin nhắn từ ChatGPT",
  },
  Memory: {
    Title: "Lịch sử tin nhắn",
    EmptyContent: "Chưa có tin nhắn",
    Send: "Gửi tin nhắn trong quá khứ",
    Copy: "Sao chép tin nhắn trong quá khứ",
    Reset: "Đặt lại phiên",
    ResetConfirm:
      "Đặt lại sẽ xóa toàn bộ lịch sử trò chuyện hiện tại và bộ nhớ. Bạn có chắc chắn muốn đặt lại không?",
  },
  Home: {
    NewChat: "Cuộc trò chuyện mới",
    DeleteChat: "Xác nhận xóa các cuộc trò chuyện đã chọn?",
    DeleteToast: "Đã xóa cuộc trò chuyện",
    Revert: "Khôi phục",
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
    Title: "Cài đặt",
    SubTitle: "Tất cả cài đặt",

    Lang: {
      Name: "Language", // ATTENTION: if you wanna add a new translation, please do not translate this value, leave it as `Language`
      All: "Tất cả ngôn ngữ",
    },
    Avatar: "Ảnh đại diện",
    FontSize: {
      Title: "Font chữ",
      SubTitle: "Thay đổi font chữ của nội dung trò chuyện",
    },
    Update: {
      Version: (x: string) => `Phiên bản: ${x}`,
      IsLatest: "Phiên bản mới nhất",
      CheckUpdate: "Kiểm tra bản cập nhật",
      IsChecking: "Kiểm tra bản cập nhật...",
      FoundUpdate: (x: string) => `Phát hiện phiên bản mới: ${x}`,
      GoToUpdate: "Cập nhật",
    },
    SendKey: "Phím gửi",
    Theme: "Theme",
    TightBorder: "Chế độ không viền",
    SendPreviewBubble: {
      Title: "Gửi bong bóng xem trước",
      SubTitle: "Xem trước nội dung markdown bằng bong bóng",
    },
    Mask: {
      Title: "Mask Splash Screen",
      SubTitle: "Chớp màn hình khi bắt đầu cuộc trò chuyện mới",
    },
    Prompt: {
      Disable: {
        Title: "Vô hiệu hóa chức năng tự động hoàn thành",
        SubTitle: "Nhập / để kích hoạt chức năng tự động hoàn thành",
      },
      List: "Danh sách mẫu gợi ý",
      ListCount: (builtin: number, custom: number) =>
        `${builtin} có sẵn, ${custom} do người dùng xác định`,
      Edit: "Chỉnh sửa",
      Modal: {
        Title: "Danh sách mẫu gợi ý",
        Add: "Thêm",
        Search: "Tìm kiếm mẫu",
      },
      EditModal: {
        Title: "Chỉnh sửa mẫu",
      },
    },
    HistoryCount: {
      Title: "Số lượng tin nhắn đính kèm",
      SubTitle: "Số lượng tin nhắn trong quá khứ được gửi kèm theo mỗi yêu cầu",
    },
    CompressThreshold: {
      Title: "Ngưỡng nén lịch sử tin nhắn",
      SubTitle: "Thực hiện nén nếu số lượng tin nhắn chưa nén vượt quá ngưỡng",
    },
    Token: {
      Title: "API Key",
      SubTitle: "Sử dụng khóa của bạn để bỏ qua giới hạn mã truy cập",
      Placeholder: "OpenAI API Key",
    },
    Usage: {
      Title: "Hạn mức tài khoản",
      SubTitle(used: any, total: any) {
        return `Đã sử dụng $${used} trong tháng này, hạn mức $${total}`;
      },
      IsChecking: "Đang kiểm tra...",
      Check: "Kiểm tra",
      NoAccess: "Nhập API Key để kiểm tra hạn mức",
    },
    AccessCode: {
      Title: "Mã truy cập",
      SubTitle: "Đã bật kiểm soát truy cập",
      Placeholder: "Nhập mã truy cập",
    },
    Model: "Mô hình",
    Temperature: {
      Title: "Tính ngẫu nhiên (temperature)",
      SubTitle: "Giá trị càng lớn, câu trả lời càng ngẫu nhiên",
    },
    MaxTokens: {
      Title: "Giới hạn số lượng token (max_tokens)",
      SubTitle: "Số lượng token tối đa được sử dụng trong mỗi lần tương tác",
    },
    PresencePenalty: {
      Title: "Chủ đề mới (presence_penalty)",
      SubTitle: "Giá trị càng lớn tăng khả năng mở rộng sang các chủ đề mới",
    },
    FrequencyPenalty: {
      Title: "Hình phạt tần suất",
      SubTitle: "Giá trị lớn hơn làm giảm khả năng lặp lại cùng một dòng",
    },
  },
  Store: {
    DefaultTopic: "Cuộc trò chuyện mới",
    BotHello: "Xin chào! Mình có thể giúp gì cho bạn?",
    Error: "Có lỗi xảy ra, vui lòng thử lại sau.",
    Prompt: {
      History: (content: string) =>
        "Tóm tắt ngắn gọn cuộc trò chuyện giữa người dùng và AI: " + content,
      Topic:
        "Sử dụng 4 đến 5 từ tóm tắt cuộc trò chuyện này mà không có phần mở đầu, dấu chấm câu, dấu ngoặc kép, dấu chấm, ký hiệu hoặc văn bản bổ sung nào. Loại bỏ các dấu ngoặc kép kèm theo.",
      Summarize:
        "Tóm tắt cuộc trò chuyện này một cách ngắn gọn trong 200 từ hoặc ít hơn để sử dụng làm gợi ý cho ngữ cảnh tiếp theo.",
    },
  },
  Copy: {
    Success: "Sao chép vào bộ nhớ tạm",
    Failed:
      "Sao chép không thành công, vui lòng cấp quyền truy cập vào bộ nhớ tạm",
  },
  Context: {
    Toast: (x: any) => `Sử dụng ${x} tin nhắn chứa ngữ cảnh`,
    Edit: "Thiết lập ngữ cảnh và bộ nhớ",
    Add: "Thêm tin nhắn",
  },
  Plugin: {
    Name: "Plugin",
  },
  Mask: {
    Name: "Mẫu",
    Page: {
      Title: "Mẫu trò chuyện",
      SubTitle: (count: number) => `${count} mẫu`,
      Search: "Tìm kiếm mẫu",
      Create: "Tạo",
    },
    Item: {
      Info: (count: number) => `${count} tin nhắn`,
      Chat: "Chat",
      View: "Xem trước",
      Edit: "Chỉnh sửa",
      Delete: "Xóa",
      DeleteConfirm: "Xác nhận xóa?",
    },
    EditModal: {
      Title: (readonly: boolean) =>
        `Chỉnh sửa mẫu ${readonly ? "(chỉ xem)" : ""}`,
      Download: "Tải xuống",
      Clone: "Tạo bản sao",
    },
    Config: {
      Avatar: "Ảnh đại diện bot",
      Name: "Tên bot",
    },
  },
  NewChat: {
    Return: "Quay lại",
    Skip: "Bỏ qua",
    Title: "Chọn 1 biểu tượng",
    SubTitle: "Bắt đầu trò chuyện ẩn sau lớp mặt nạ",
    More: "Tìm thêm",
    NotShow: "Không hiển thị lại",
    ConfirmNoShow: "Xác nhận tắt? Bạn có thể bật lại trong phần cài đặt.",
  },

  UI: {
    Confirm: "Xác nhận",
    Cancel: "Hủy",
    Close: "Đóng",
    Create: "Tạo",
    Edit: "Chỉnh sửa",
  },
  Exporter: {
    Model: "Mô hình",
    Messages: "Thông điệp",
    Topic: "Chủ đề",
    Time: "Thời gian",
  },
};

export default vi;
