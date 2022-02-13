<template>
  <el-container class="home-container">
    <el-header height="70px">
      <div class="logo">
        <img src="../assets/logo1.png" alt="" />
      </div>
      <span>后台管理系统</span>
      <el-button type="info" @click="logout">退出</el-button>
    </el-header>
    <el-container>
      <el-aside width="200px">
        <div class="toggle-button">折叠</div>
        <el-menu unique-opened router :default-active="activePath">
          <!-- 一级菜单  index只接收字符串 而item.id为数字 所以在其后拼接上空字符串 数字+空字符串=字符串-->
          <el-submenu
            :index="item.id + ''"
            v-for="item in menulist"
            :key="item.id"
          >
            <!-- 一级菜单的模板区 -->
            <template slot="title">
              <!-- i 为图标 在class前面添加绑定，每循环一次给它的class添加上iconsObj对象中的属性 比如第一次循环就是iconsObj【125】其对应的数据就是el-icon-user-solid -->
              <i :class="iconsObj[item.id]"></i>
              <span>{{ item.authName }}</span>
            </template>
            <!-- 二级菜单 -->
            <el-menu-item
              :index="subItem.id + ''"
              v-for="subItem in item.children"
              :key="subItem.id" @click="saveNavState(item.id)"
            >
              <i class="el-icon-menu"></i>{{ subItem.authName }}
            </el-menu-item>
          </el-submenu>
        </el-menu>
      </el-aside>
      <el-main>
        <router-view></router-view>
        </el-main>
    </el-container>
  </el-container>
</template>

<script>
export default {
  data() {
    return {
      menulist: [],
      iconsObj: {
        125: 'el-icon-user-solid',
        103: 'el-icon-star-on',
        101: 'el-icon-s-goods',
        102: 'el-icon-s-order',
        145: 'el-icon-s-platform'
      },
      activePath: ''
    }
  },
  /* 定义生命周期函数 在页面刚加载时就立即获取左侧菜单数据 */
  created() {
    this.getMenuList()
    this.activePath = window.sessionStorage.getItem('activePath')
  },
  methods: {
    logout() {
      window.sessionStorage.clear()
      this.$router.push('/login')
    },
    /* 获取菜单数据  因为get方法返回的是promise 所以需要用async和await */
    async getMenuList() {
      /* 解构赋值 将data中的数据解析出来重命名为res */
      const { data: res } = await this.$http.get('menus')
      if (res.meta.status !== 200) return this.$message.error(res.meta.msg)
      this.menulist = res.data
      console.log(res)
    },
    saveNavState(activePath) {
      window.sessionStorage.setItem('activePath', activePath)
      this.activePath = activePath
    }
  }
}
</script>

<style lang="less" scoped>
.home-container {
  height: 100%;
}
.el-header {
  background-color: #fff;
  display: flex;
  justify-content: space-between;
  padding-left: 35px;
  align-items: center;
  font-size: 20px;
}
.el-menu {
  border-right: none;
}
.el-main {
  background-color: #eee;
}
.logo {
  height: 60px;
  width: 60px;
  border: 1px solid #eee;
  border-radius: 50%;
  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
  }
}
.toggle-button {
  background-color: azure;
  text-align: center;
}
</style>
