<template>
  <div >
    <el-breadcrumb separator="/">
    <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
    <el-breadcrumb-item><a href="/">权限管理</a></el-breadcrumb-item>
    <el-breadcrumb-item>角色列表</el-breadcrumb-item>
    </el-breadcrumb>
    <el-card>
      <el-row>
        <el-col>
          <el-button type="primary">添加角色</el-button>
        </el-col>
      </el-row>
      <el-table :data="rolesList" border stripe>
        <el-table-column type="expand">
          <template slot-scope="scope">
            <!-- v-for="(item,i) in object" 其中item和i都可以自己取名 item是遍历出来的数据 i是索引序号 -->
            <el-row :class="['expand', 'vcenter']" v-for="(item1, i1) in scope.row.children" :key="item1.id">
              <!-- alt+shift+A快捷注释 第一列渲染一级权限 -->
              <el-col :span="5">
                <el-tag closable @close="removeRightById(scope.row, item1.id)">{{i1+1}} {{item1.authName}}</el-tag>
                <i class="el-icon-caret-right"></i>
              </el-col>
              <!-- 渲染二级和三级权限 -->
              <el-col :span="19">
                <el-row class="vcenter" v-for="(item2, i2) in item1.children" :key="item2.id">
                  <el-col :span="6">
                    <el-tag type="success" closable @close="removeRightById(scope.row, item2.id)">{{i2+1}} {{item2.authName}}</el-tag>
                    <i class="el-icon-caret-right"></i>
                  </el-col>
                  <el-col :span="18">
                    <el-tag type="warning" v-for="(item3, i3) in item2.children" :key="item3.id" closable @close="removeRightById(scope.row, item3.id)">{{i3+1}} {{item3.authName}}</el-tag>
                  </el-col>
                </el-row>
              </el-col>
            </el-row>
          </template>
        </el-table-column>
        <el-table-column type="index"></el-table-column>
        <el-table-column label="角色名称" prop="roleName"></el-table-column>
        <el-table-column label="角色描述" prop="roleDesc"></el-table-column>
        <el-table-column label="操作" width="300px">
          <template slot-scope="scope">
            <el-button size="mini" type="primary" icon="el-icon-edit">编辑</el-button>
            <el-button size="mini" type="danger" icon="el-icon-delete">删除</el-button>
            <el-button size="mini" type="warning" icon="el-icon-setting" @click="showSetRightDialog(scope.row)">分配权限</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
      <el-dialog
        title="分配权限"
        :visible.sync="setRightDialogVisible"
        width="50%" @close="setRightClosed">
        <!-- el-tree是树形控件 -->
        <el-tree :data="rightsList" :props="treeProps" show-checkbox node-key="id" default-expand-all="true" :default-checked-keys="defKeys" ref="treeRef"></el-tree>
          <el-button @click="setRightDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="allotRights">确 定</el-button>
      </el-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      // 所有角色列表数据
      rolesList: [],
      setRightDialogVisible: false,
      rightsList: [],
      // 树形控件的属性绑定对象
      treeProps: {
        label: 'authName',
        children: 'children'
      },
      // 默认选中的节点的id值
      defKeys: [],
      // 当前点击的角色的id
      roleId: ''
    }
  },
  created() {
    this.getRolesList()
  },
  methods: {
    async getRolesList() {
      // 获取所有角色列表数据
      const { data: res } = await this.$http.get('roles/')
      if (res.meta.status !== 200) {
        return this.$message.error('获取角色列表失败')
      }
      this.rolesList = res.data
    },
    async removeRightById(role, rightId) {
      const confirmResult = await this.$confirm('此操作将永久删除该用户, 是否继续?', '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).catch(err => err)
      if (confirmResult !== 'confirm') {
        return this.$message.info('已取消删除')
      }
      const { data: res } = await this.$http.delete(`roles/${role.id}/rights/${rightId}`)
      if (res.meta.status !== 200) {
        return this.$message.error('删除权限失败')
      }
      role.children = res.data
    },
    async showSetRightDialog(role) {
      this.roleId = role.id
      // 先获取所有权限数据
      const { data: res } = await this.$http.get('rights/tree')
      this.setRightDialogVisible = true
      if (res.meta.status !== 200) {
        return this.$message.error('获取权限数据失败')
      }
      this.rightsList = res.data
      // 1 第一步 在对话框出现时获取三级权限的id role是接收scope.row的形参
      this.getLeafKeys(role, this.defKeys)
    },
    // 2 第二步 通过递归形式获取角色列表下所有三级权限的id，然后保存到defKey数组中
    getLeafKeys(node, arr) {
      if (!node.children) {
        return arr.push(node.id)
      }
      node.children.forEach(item =>
        this.getLeafKeys(item, arr))
    },
    // 监听分配权限对话框关闭事件 每次关闭对话框则清空该数组 否则数组内的数据会累加
    setRightClosed() {
      this.defKeys = []
    },
    async allotRights() {
      // ...为展开运算符,将一个数组转为用逗号分隔的参数序列
      const keys = [
        ...this.$refs.treeRef.getCheckedKeys(),
        ...this.$refs.treeRef.getHalfCheckedKeys()
      ]
      // 把数组转换成以“,” 英文状态下的逗号拼接成的字符串
      const idStr = keys.join(',')
      const { data: res } = await this.$http.post(`roles/${this.roleId}/rights`, { rids: idStr })
      if (res.meta.status !== 200) {
        return this.$message.error('分配权限失败')
      }
      this.$message.success('分配权限成功')
      this.getRolesList()
      this.setRightDialogVisible = false
    }
  }
}
</script>

<style lang="less" scoped>
.el-tag {
  margin: 7px;
}
.expand {
  border-top: 1px solid #eee;
}
.vcenter {
   display: flex;
   align-items: center;
}
</style>
