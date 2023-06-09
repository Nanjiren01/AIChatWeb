<div align="center" style="margin-bottom: 10px;">
<img src="./docs/images/icon.svg" alt="预览"/>

<h1 align="center">AI Chat Web</h1>
<a href="#一键部署">一键部署</a>
·
<a href="https://www.nanjiren.online" target="_blank">官 网</a>
·
<a href="#演示地址">演示地址</a>
·
<a href="#项目优势">项目优势</a>
·
<a href="#知识星球优秀案例">优秀案例</a>
</div>

Based on [ChatGPT-Next-Web](https://github.com/Yidadaa/ChatGPT-Next-Web.git), this repository added some magic functions, like login, register...

本项目是在[ChatGPT-Next-Web](https://github.com/Yidadaa/ChatGPT-Next-Web.git)的基础上增加登录，注册等功能（注意，由于登录注册需要后台支持，因此本项目需要单独部署后端服务才可以运行）

**本项目不再支持在vercel上正常运行**

**This project can NOT run on the vercel.**

## 演示地址

前台 http://chat.nanjiren.online

后台 http://admin.nanjiren.online
账号：aichat
密码：aichatadmin

**温馨提示，由于后台开放，请勿在演示站中输入敏感信息**

## 项目优势

### 1、零基础，不会敲代码也可以搭建

快速：项目提供一键部署脚本，采购服务器后只需执行一键部署脚本即可搭建，整个过程最快不超过3分钟。

简单：部署后，进入提供的管理后台，即可定义自己站点的内容，无需修改任何代码，无需构建部署环节，即改即生效。

### 2、高度自定义

项目提供方便易用，成熟稳定的管理后台（基于[vue-element-admin](https://panjiachen.github.io/vue-element-admin)），绝大部分内容可以在后台直接设定。

#### 2.1、网站标题、欢迎词、公告自定义

可以自定义网站标题，副标题；
可以自定义欢迎词，支持富文本格式，您可以在此处添加图片（例如二维码）进行引流；
可以编辑公告，同样支持富文本格式，您可以在此处展示使用声明、通知，可以选择是否开屏展示；

![网站标题、欢迎词、公告自定义](./docs/images/intro1.png)

#### 2.2、套餐玩法自定义

次卡？周卡？月卡？统统可以在后台定义。

![套餐](./docs/images/package.png)

![套餐后台配置](./docs/images/package2.png)

#### 2.3、更多自定义内容

在后台管理中，您还可以设定注册方式（支持用户名+密码方式、图形验证码方式、邮箱注册方式），各页面主副标题，出现敏感词时的提示语，额度不足提示语……

本项目区分社区版，及Pro版

## 社区版功能 AIChat Community Function

| 功能                                                      | 进度 |
| --------------------------------------------------------- | -------- |
| 用户管理（User Management）                               |    ✔已完成(v0.0.1)     |
| 额度管理（Quota Management）                              |    ✔已完成(v0.1)     |
| 注册额度赠送（Registration limit gift）                   |    ✔已完成(v0.1)     |
| 邮箱验证码注册（Email verification code registration）    |    ✔已完成(v0.1)     |
| 调用频率限制（User based call frequency limit） |   ✔已完成(v0.1)       |
| 图形验证码注册（Graphic verification code registration）  |    ✔已完成(v0.2)     |
| 网站标题（Website Title Customization）                   |   ✔已完成(v0.2)      |
| 套餐管理（Package Management）                            |   ✔已完成(v0.2)      |
| 自定义敏感词拦截（Custom sensitive word interception）    |   ✔已完成(v0.2)   |
| 修改密码（Change password）                               |   进行中       |
| 绘图功能（Drawing function）                              |   进行中       |





## Pro版功能 AIChat Pro Function

| 功能                                                         | 进度     |
| ------------------------------------------------------------ | -------- |
| 社区版的全功能（Full functionality of the community version） | ✔        |
| 邀请机制（Invitation mechanism）                             | 进行中   |
| 服务端消息保存（Chat Saved by Server）                       | 进行中   |
| 仪表盘（new user count curve, chat count curve）             | 进行中   |
| 对接支付系统（Connect to the payment system Pay）            | 进行中   |
| 对接发卡平台（Docking with card issuing platforms）          | 进行中   |
| 多模型支持（Multiple model support）                         | 长期进行 |



## 预览Preview

### 聊天 Chat

![聊天页](./docs/images/chat.png)

### 登录 Login
![登录页](./docs/images/Login.png)


### 注册 Register
![注册页](./docs/images/Register.png)

### 个人中心 Profile

![个人中心](./docs/images/Profile.png)



本项目需要依赖特定的后端，以及相应的后台管理前端项目。

This project depends on the given projects below.

### AI Chat Console(front-end project)

https://github.com/Nanjiren01/AIChatConsole

#### 会员列表 Member List

![成员列表](./docs/images/members.png)

#### 次数变动记录/手动添加次数 Quota Record

![次数变动记录](./docs/images/quota.png)

### AI Chat Admin(back-end project)

https://github.com/Nanjiren01/AIChatAdmin

## 一键部署

1. 在云厂商购买一台合适配置的服务器，操作系统选择CentOS 7.9（其他版本未测试）
2. 在安全组中放行80端口和8080端口
3. 连接云服务器，在命令行中运行以下代码

```shell
bash <(curl -s https://raw.githubusercontent.com/Nanjiren01/AIChatWeb/main/scripts/setup.sh)
```

命令运行过程中，需要设置超级管理员的账号和密码（请将aichat888更改为自己的账号密码并牢记），如下所示：

```text
Please input the super admin username. 
Only letters and numbers are supported, the length should between 6 and 20, and they cannot start with a number.
Username: aichat888
Super Admin Username is valid.
Please input the super admin password. 
Only letters and numbers are supported, and the length should between 6 and 20. 
You can change it on the web page after the Application running
Password: aichat888
Super Admin Password is valid.
```

当出现以下提示，说明部署成功

```shell
[+] Running 5/5
 ✔ Network root_default      Created
 ✔ Container aichat-db       Started
 ✔ Container aichat-admin    Started
 ✔ Container aichat-console  Started
 ✔ Container aichat-web      Started         
```

稍等几秒钟应用初始化，即可打开http://IP访问前台页面，打开http://IP:8080访问后台服务。

由于在命令行中设定的密码较为简单（只包含字母和数字），建议应用启动后，尽快进入后台修改超管密码。

## License 
本仓库是基于仓库 [Yidadaa's ChatGPT-Next-Web](https://github.com/Yidadaa/ChatGPT-Next-Web) 的996许可证，以[MIT license](./LICENSE)的形式重新分发。



### 加入QQ交流群、微信群获取更多内容

<img src="./docs/images/QQ.jpeg" width="400px" alt="QQ" style="display: inline-block" />

<img src="./docs/images/wechat3.jpg" width="400px" alt="wechat" style="display: inline-block" />

## 知识星球

加入知识星球福利
- 免费获取AIChat pro版
- 有可能获得免费定制服务
- 优秀案例展示
- 高级教程（包括HTTPS搭建、域名注册、服务器购买、高级套餐页制作）
- ChatGPT高级使用手册
- 新功能优先体验

> 当前星球为试运行阶段，部分内容仍在筹备中


当前星球价格为128元，随着功能的不断完善，知识星球价格逐步提升

<img src="./docs/images/xingqiu.jpeg" width="500px" alt="AIChatAdmin知识星球"/>


## 知识星球优秀案例

### YOURS-AI
网址：[https://junmao.shop/](https://junmao.shop/)
用户：300+

### NEU-GPT
网址：[https://neu.zxyt.top/](https://neu.zxyt.top/)
用户：150+

### AI Ultra
网址：[https://chat.wzunjh.top/](https://chat.wzunjh.top/)
用户：300+

### pro版本规划路线

1. 对接支付系统 Pay
2. 邀请机制（邀请赠送额度）
3. 仪表盘（新增用户数曲线图、聊天数量曲线图）
4. 对接发卡平台
5. 服务端消息保存（Chat Saved by Server）
6. 多模型支持（Claude、Bard……）
