<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width=330 height=86 src="//music.163.com/outchain/player?type=2&id=450567505&auto=0&height=66"></iframe>

[本文地址](http://linshuirong.cn/dist/#/blog/590b422dad0509492140bc43)

#### 1.代码压缩(gzip)

如果你用的是`nginx`服务器，请修改配置文件(其他web server 类似)：

`sudo nano /etc/nginx/nginx.conf`

在Gzip Settings里加入：

```shell
gzip on;
gzip_min_length 1k;
gzip_buffers 4 16k;
gzip_comp_level 5;
gzip_types text/plain application/x-javascript text/css application/xml text/javascript application/x-httpd-php;
```

* gzip
  * 开启或者关闭 gzip 模块，这里使用 on 表示启动
* gzip_min_length
  * 设置允许压缩的页面最小字节数．默认值是0，不管页面多大都压缩．
* gzip_buffers
  * 设置系统获取几个单位的缓存用于存储gzip的压缩结果数据流．4 16k 代表以 16k 为单位，按照原始数据大小以 16k 为单位的4倍申请内存
* gzip_comp_level
  * 压缩比，压缩比１最小处理速度最快，压缩比9最大但处理最慢（传输快但比较消耗cpu）
* gzip_types
  * 匹配MIME类型进行压缩，（无论是否指定）"text/html" 类型总是会被压缩


> 我这样配置，把首页一个需要下载的文件由716KB压缩到了246KB．优化比66%．

**如果你没有开启服务器端的gzip，也可以开启前后端代码的压缩**

如果你后端用的是Express.js框架来提供Web服务，那么可以使用压缩中间件进行[gzip压缩](https://expressjs.com/zh-cn/advanced/best-practice-performance.html)．

```javascript
var compression = require('compression');
var express = require('express');
var app = express();
app.use(compression());
```

如果你前端是用`vue-cli`生成的项目，那么在Webpack配置文件（生产环境）中已经开启了代码的压缩．

#### ２. 外部文件按需引入||不用外部文件，自己造轮子

**在项目中使用`Element`的话，按需引入：**

首先安装 [babel-plugin-component](https://github.com/QingWei-Li/babel-plugin-component)：

`npm install babel-plugin-component -D`

它让我们可以只引入需要的组件，以达到减小项目体积的目的.

PS: 如果这时报错：

```shell
Error: post install error, please remove node_modules before retry
```

这是`cnpm`的锅．原因不详．解决办法是换用npm安装此模块．(我试过移除node_modules文件，报错依旧)

**如果你用了Ajax相关的库，比如vue-resource/axios的话**

去掉它，自己实现一个Ajax库吧．

比如我的项目中只涉及了`get`,`post`，那么vue-resource/axios对我来说就很没必要了．

所以我就封装个库（支持Promise,不支持IE）在Vue中当作插件使用：

```javascript
/* xhr.js */
class XHR {
    get(url) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && (xhr.status < 300 || xhr.status === 304)) {
                        if (xhr.responseText) {
                            resolve(JSON.parse(xhr.responseText));
                        } else {
                            resolve(xhr.responseText);
                        }
                    } else {
                        reject(`XHR unsuccessful:${xhr.status}`);
                    }
                }
            };
            xhr.open('get', url, true);
            xhr.setRequestHeader('content-type', 'application/json');
            xhr.send(null);
        });
    }

    post(url, data) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && (xhr.status < 300 || xhr.status === 304)) {
                        resolve(JSON.parse(xhr.responseText));
                    } else {
                        reject(`XHR unsuccessful:${xhr.status}`);
                    }
                }
            };
            xhr.open('post', url, true);
            xhr.setRequestHeader('content-type', 'application/json');
            xhr.send(JSON.stringify(data));
        });
    }
}

/* Vue插件要求提供install方法：https://cn.vuejs.org/v2/guide/plugins.html */
XHR.install = (Vue) => {
    Vue.prototype.$get = new XHR().get;
    Vue.prototype.$post = new XHR().post;
};

export default XHR;
```

> 这种方法一般能缩小文件几十KB．比如vue-resource有35KB,我的这个xhr.js只有1.9KB．



#### 3．代码分块/Code Splitting  

顾名思义，就是讲代码分成块，按需加载．这样，如果首屏不需要的块，就不用加载了．

对于大型项目可能更有用，因为在我的这个项目中首页需要的文件和其他页面需要的基本一样，所以代码分块对我这个项目而言，就没必要了．

#### 4. 路由组件懒加载

当打包构建应用时，Javascript 包会变得非常大，影响页面加载。如果我们能把不同路由对应的组件分割成不同的代码块，然后当路由被访问的时候才加载对应组件，这样就更加高效了

结合 Vue 的 [异步组件](http://vuejs.org/guide/components.html#Async-Components) 和 Webpack 的 [code splitting feature](https://webpack.js.org/guides/code-splitting-require/),可以轻松实现路由组件的懒加载．

我们要做的就是把路由对应的组件定义成异步组件：

```javascript
const Foo = resolve => {
  /* require.ensure 是 Webpack 的特殊语法，用来设置 code-split point
  （代码分块）*/
  require.ensure(['./Foo.vue'], () => {
    resolve(require('./Foo.vue'))
  })
}
/* 另一种写法 */
const Foo = resolve => require(['./Foo.vue'], resolve);
```

不需要改变任何路由配置，跟之前一样使用 `Foo`：

```javascript
const router = new VueRouter({
  routes: [
    { path: '/foo', component: Foo }
  ]
})
```

#### 4. Webpack2 Tree-shaking

`Tree-shaking` 用来消除没有用到的代码．

> 个人小项目一般用不到tree-shaking．因为你不会写没用到的代码．规模很大的项目或许可以尝试使用它．

#### 5. 减少XHR中不必要的数据．

比如我的项目中，首页只需要博客Title,id和Tags．Time和Content不需要了，况且Content一般还很大(一般一篇10KB左右)．

#### 6. SSR(Server Side Render/服务端渲染)

这个有点难搞．但效果貌似挺不错．我之前在[Vue文档中](https://cn.vuejs.org/v2/guide/ssr.html)简单看了一边，打算以后有需求了再搞不迟．

#### 7. 其他诸如图片懒加载就不赘述了，前端开发者应该有的常识．
