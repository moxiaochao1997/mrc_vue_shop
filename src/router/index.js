import Vue from 'vue'
import VueRouter from 'vue-router'
import Login from '../components/login.vue'
import Home from '../components/Home.vue'
import Welcome from '../components/Welcome.vue'
import Users from '../components/user/Users.vue'
import Rights from '../components/power/Rights.vue'
import Roles from '../components/power/Roles.vue'
import Cate from '../components/goods/Cate.vue'
import Params from '../components/goods/Params.vue'
import List from '../components/goods/List.vue'
import Add from '../components/goods/Add.vue'
import Order from '../components/order/Order.vue'

Vue.use(VueRouter)

const routes = [
  { path: '/login', component: Login },
  { path: '/', redirect: '/login' },
  {
    path: '/home',
    component: Home,
    redirect: '/Welcome',
    children: [{ path: '/Welcome', component: Welcome },
      { path: '/110', component: Users },
      { path: '/112', component: Rights },
      { path: '/111', component: Roles },
      { path: '/121', component: Cate },
      { path: '/115', component: Params },
      { path: '/104', component: List },
      { path: '/107', component: Order },
      { path: '/goods/add', component: Add }
    ]
  }
]
const router = new VueRouter({
  routes
})
// 挂载路由导航守卫
router.beforeEach((to, from, next) => {
  // to表示将要访问的路径
  // from代表从哪个路径跳转而来
  // next是一个函数，表示放行 next('/路径')表示强制跳转到指定路径
  if (to.path === '/login') return next()
  // 获取token 如有token则判断是否为空
  const tokenStr = window.sessionStorage.getItem('token')
  // 如果！token为真则说明token为空 强制跳转 否则放行
  if (!tokenStr) return next('/login')
  next()
})
export default router
