<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width=330 height=86 src="//music.163.com/outchain/player?type=2&id=16593581&auto=0&height=66"></iframe>

Github: https://github.com/shuiRong/VueCnodeJS/tree/master/vuexVersion
[本文地址](http://linshuirong.cn/dist/#/blog/59284d217f59ed0b9b34bb1f)

### 前言

---

看完[Vuex](https://vuex.vuejs.org/zh-cn/)文档之后，对于如何把它应用到`实际项目`中还是有点茫然。

找了一圈Gayhub，有Vuex的项目不是太大，就是太小，或者就是对Vuex的一些重要概念没有给出实际用例。

贼气。干脆我把之前的项目用Vuex改造下当作练习了。所以我就把[VueCnodeJS](https://github.com/shuiRong/VueCnodeJS)给改造了下。

因为这个VueCnodeJS这个项目呢，是初级Vue项目，逻辑不复杂，但也涉及了5个组件，而且有从服务器获取数据的步骤，正好为Vuex的异步`actions`提供了很好的场景。

**所以，如果你看完了Vuex文档，但是对在实际项目中怎么用它不太懂的话，这个项目就是为你准备的！**


**涉及了Vuex的 State，Getters，Mutations，Actions**

* State: 相当于Vue的Data里的东西
* Getters: 相当于Vue的Computed
* Mutations: 相当于Vue的Methods（仅限同步操作）
* Actions: 相当于Methods(所有异步操作在这里)

PS: 其实没必要把组件里的所有数据都放到`state.js`里。但是为了练习Vuex嘛，就全从组件里分离出来了。(什么样的数据才应该放到state.js中？看文档 : )

#### 本地运行

---

```bash
git clone https://github.com/shuiRong/VueCnodeJS.git 
cd VueCnodeJS/vuexVersion
npm install
npm run dev
```

(默认用的是8080端口)