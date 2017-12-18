<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width=330 height=86 src="//music.163.com/outchain/player?type=2&id=467117858&auto=0&height=66"></iframe>

 [本文地址](http://linshuirong.cn/dist/#/blog/591fbda9aea4aa5661fde5b9)

 `谨以此篇祭奠我逝去的Bug大人`

 ---

 **前言:**

 这次debug，花了我差不多两天时间．昨天下午决定过了凌晨再解决不掉的话，就打算放弃了．但代码的人生总是充满戏剧性的．一次不报希望的尝试，居然就给解决掉了．呜呼．

 #### Bug初现：

 前两天我开了个[repo](https://github.com/shuiRong/StrongSpiders)：包括五只Python爬虫：

 1. [王垠](Yinwang.org)的所有博客
 2. [拉勾](lagou.com)特定选择的所有招聘数据
 3. [网易云](music.163.com/#/song?id=450567505)歌单或者喜欢的音乐的下载
 4. [知乎](https://www.zhihu.com/)的数据爬取
 5. QQ空间或者微博数据的爬取

 这五只爬虫从简到难，涉及到静动态页，从接口获取数据，模拟登录，验证码识别．还可能涉及到模拟浏览器环境，数据的可视化(4，５)．总而言之，这五只爬虫写完，Python爬虫的技能就点的差不多了．

 然后在写完第一只爬虫之后，去我的[博客](http://linshuirong.cn)上写说明时，发现上传图片功能出问题了．

 ![图片](http://linshuirong.cn:3000/images/202017115018.png)
 ![图片](http://linshuirong.cn:3000/images/202017115021.png)


 注意这句：` provisional headers are shown `

 同时这个post请求是`pedding`状态，在几分钟之后显示`failed`.

 **PS：** 这里有必要说明下相关的逻辑．

 这个post请求是在用户选择上传的图片之后发起的．前端在把图片读取为base64字符串后（为什么选择这样上传图片，与主题无关，暂时不表），由这个post发送给后端，然后后端把base64转成二进制，再写入图片文件（根据用户图片格式新建的文件），然后再把图片路径返回给前端．

 #### 尝试Debug：

 我首先做的．．．是查了下＂provisional＂什么意思：）

 然后Google．

 在[这篇](https://segmentfault.com/q/1010000000364871)贴子里我得知这个Warning的意思是：

 ```text
 这个警告的意思是说：请求的资源可能会被（扩展／或其他什么机制）屏蔽掉。

 之所以会出现这个警告，是因为去获取该资源的请求其实并（还）没有真的发生，所以 Header 里显示的是伪信息，直到服务器真的有响应返回，这里的 Header 信息才会被更新为真实的。不过这一切也可能不会发生，因为该请求可能会被屏蔽。比如说 AdBlock 什么的，当然了不全是浏览器扩展，具体情况具体分析了。
 ```

 从其他的很多中文博客里，我也得到的是这个意思．（但最后结果出来，我却发现其实request没问题，是服务端response的事．（具体后面再说））

 然后从[这篇](https://stackoverflow.com/questions/5585918/what-does-pending-mean-for-request-in-chrome-developer-window),[这篇](http://fex.baidu.com/blog/2015/01/chrome-stalled-problem-resolving-process/)贴子里得到了很多解决思路，包括但不限于：

* 请求被AdBlock，HTTPS everywhere或类似的插件给屏蔽掉了．(关掉后，问题依旧)
* 请求被代理或者GFW屏蔽掉．(代理关掉后，问题依旧)
* Chrome的bug．（没法测试．但感觉不是）
* 防火墙，杀软．（没杀软，感觉不是防火墙）
* 应该把Ajax请求放到异步操作里．（虽然有点莫名其妙，但我也试了．依旧）
* Chrome的缓存机制问题（request/response设置no-cache，依旧）

 把这所有的方案试过都没用之后，我有点懵了．我开始怀疑自己，哦不，自己的代码了．然后去查文档，想看是不是某个函数的知识点我不了解．．．

 但在我把代码回滚到之前我能确定没问题时的commit，同时我发现，在本地运行却没问题后，**我基本能确定了：我写的代码没问题！**(就是在这步走错了，导致我多花了一天的时间才解决问题．)

 下面我就开始求助群里大佬了．并把chrome的`chrome://net-internals/#events`里的相关日志贴给了大佬，大佬表示好久之前遇到过这问题，但忘了怎么解决的了，并给了一种思路，还没来得及测试它，问题就解决了．

 到昨天晚上8点左右的时候，我已经怀疑到服务器了．想重装下系统．但因为这样折腾有些麻烦，就放到最后才考虑这个．

 然后**终于开始**怀疑是代码问题了，我把前端后关键地方打印了下．看关键变量的值对不对．发现：前端没问题．后端正常获取到base64字符串.所以后面的图片存储应该出问题了．

 我又把图片存储部分的代码分离出来，测试．终于发现把图片数据写入到文件时有未知问题，**导致:**

 程序会重复对文件进行写操作，但就是写不进去．而因为向客户端返回response信息是在写操作的callback里，所以浏览器就迟迟拿不到response，就显示了：`provisional headers are shown`.

 **另外**：我在Node交互命令行里测试这段代码时，写操作立刻就完成了．但是对应文件的大小是０．**而且写操作没报错，这是最气的．** 相同的代码在我的电脑上ok.

 我就想到：该不会是Node的问题吧．

* 服务器端Node版本：6.X(忘记具体哪个了，要不还能去给提个issue)

* 自己电脑上的Node版本：7.2.1

 **把服务器上Node版本升级到了v7.10.0　然后问题解决了-_-**
