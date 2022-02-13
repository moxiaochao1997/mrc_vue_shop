<template>
 <div>
  <el-breadcrumb separator="/">
  <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
  <el-breadcrumb-item><a href="/">用户管理</a></el-breadcrumb-item>
  <el-breadcrumb-item>用户列表</el-breadcrumb-item>
  </el-breadcrumb>
<el-card>
  <el-row :gutter="20">
    <el-col :span="7">
      <el-input placeholder="请输入内容" v-model="queryInfo.query" clearable @clear="getUserList">
       <el-button slot="append" icon="el-icon-search" @click="getUserList"></el-button>
      </el-input>
    </el-col>
    <el-col :span="4">
      <el-button type="primary" @click="addDialogVisible = true">添加用户</el-button>
    </el-col>
  </el-row>
  <el-table :data="userlist" border stripe>
    <el-table-column type="index"></el-table-column>
    <el-table-column label="姓名" prop="username"></el-table-column>
    <el-table-column label="邮箱" prop="email"></el-table-column>
    <el-table-column label="电话" prop="mobile"></el-table-column>
    <el-table-column label="角色" prop="role_name"></el-table-column>
    <el-table-column label="状态">
      <template slot-scope="scope">
        <!--- @change是一个函数，它可以拿到最新的状态值，然后赋值给userStateChange(scope.row.mg_state)括号内为实参 -->
        <el-switch v-model="scope.row.mg_state" @change="userStateChange(scope.row)"></el-switch>
      </template>
    </el-table-column>
    <el-table-column label="操作" width="180px">
      <template slot-scope="scope">
        <el-button type="primary" icon="el-icon-edit" size="mini" @click="showEditDialog(scope.row.id)"></el-button>
        <el-button type="danger" icon="el-icon-delete" size="mini" @click="removeUserById(scope.row.id)"></el-button>
        <el-tooltip effect="dark" content="分配角色" placement="top" :enterable="false">
          <el-button type="warning" icon="el-icon-setting" size="mini" @click="setRole(scope.row)"></el-button>
        </el-tooltip>
      </template>
    </el-table-column>
  </el-table>
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="queryInfo.pagenum"
      :page-sizes="[1, 2, 5, 10]"
      :page-size="queryInfo.pagesize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total">
    </el-pagination>
</el-card>
<el-dialog
  title="添加用户"
  :visible.sync="addDialogVisible"
  width="50%" @close="whenDialogFaded">
  <el-form :model="addForm" :rules="addFormRules" ref="addFormRef" label-width="70px">
  <el-form-item label="用户名" prop="username">
    <el-input v-model="addForm.username"></el-input>
  </el-form-item>
  <el-form-item label="密码" prop="password">
    <el-input v-model="addForm.password"></el-input>
  </el-form-item>
  <el-form-item label="邮箱" prop="email">
    <el-input v-model="addForm.email"></el-input>
  </el-form-item>
  <el-form-item label="手机" prop="mobile">
    <el-input v-model="addForm.mobile"></el-input>
  </el-form-item>
  </el-form>
  <span slot="footer" class="dialog-footer">
    <el-button @click="addDialogVisible = false">取 消</el-button>
    <el-button type="primary" @click="addUser">确 定</el-button>
  </span>
</el-dialog>
<el-dialog
  title="修改用户"
  :visible.sync="editDialogVisible"
  width="50%" @closed="editDialogClosed">
  <el-form :model="editForm" :rules="editFormRules" ref="editFormRef" label-width="70px">
  <el-form-item label="用户名">
    <el-input v-model="editForm.username" disabled></el-input>
  </el-form-item>
  <el-form-item label="邮箱" prop="email">
    <el-input v-model="editForm.email"></el-input>
  </el-form-item>
  <el-form-item label="手机" prop="mobile">
    <el-input v-model="editForm.mobile"></el-input>
  </el-form-item>
  </el-form>
  <span slot="footer" class="dialog-footer">
    <el-button @click="editDialogVisible = false">取 消</el-button>
    <el-button type="primary" @click="editUserInfo">确 定</el-button>
  </span>
</el-dialog>
<el-dialog
  title="分配角色"
  :visible.sync="setRoleDialogVisible"
  width="50%" @closed="setRoleDialogClosed">
  <div>
    <p>当前的用户:{{userInformation.username}}</p>
    <p>当前的角色:{{userInformation.role_name}}</p>
    <p>分配角色
      <el-select v-model="selectedRoleId" placeholder="请选择">
        <el-option
          v-for="item in rolesList"
          :key="item.id"
          :label="item.roleName"
          :value="item.id">
        </el-option>
      </el-select>
    </p>
  </div>
  <span slot="footer" class="dialog-footer">
    <el-button @click="setRoleDialogVisible = false">取 消</el-button>
    <el-button type="primary" @click="saveRoleInfo">确 定</el-button>
  </span>
</el-dialog>
 </div>
</template>

<script>
export default {
  data() {
    return {
      // 获取用户列表的参数对象，每次查询都需要queryInfo里面的三个参数，所以把它提取出来，单独放
      queryInfo: {
        query: '',
        //  query 是指查询参数也叫搜索关键字 可以为空 pagenum是指当前页码数 默认为第一页 pagesize是指默认显示的条数
        pagenum: 1,
        pagesize: 2
      },
      userlist: [],
      total: 0,
      // 控制添加用户对话框的显示与隐藏
      addDialogVisible: false,
      // 添加用户的表单数据
      addForm: {
        username: '',
        password: '',
        email: '',
        mobile: ''
      },
      // 添加表单的验证规则对象
      addFormRules: {
        username: [{
          required: true, message: '请输入用户名', trigger: 'blur'
        }, { min: 2, max: 10, message: '用户名的长度在2-10个字符', trigger: 'blur' }],
        password: [{
          required: true, message: '请输入密码', trigger: 'blur'
        }, { min: 6, max: 15, message: '密码的长度在6-15个字符', trigger: 'blur' }],
        email: [{
          required: true, message: '请输入邮箱', trigger: 'blur'
        }, { min: 6, max: 15, message: '邮箱的长度在6-15个字符', trigger: 'blur' }],
        mobile: [{
          required: true, message: '请输入手机', trigger: 'blur'
        }, { min: 11, max: 11, message: '请输入正确的手机号码', trigger: 'blur' }]
      },
      editDialogVisible: false,
      editForm: {},
      // 修改表单的验证规则对象
      editFormRules: {
        email: [{
          required: true, message: '请输入邮箱', trigger: 'blur'
        }, { min: 6, max: 15, message: '邮箱的长度在6-15个字符', trigger: 'blur' }],
        mobile: [{
          required: true, message: '请输入手机', trigger: 'blur'
        }, { min: 11, max: 11, message: '请输入正确的手机号码', trigger: 'blur' }]
      },
      setRoleDialogVisible: false,
      // 需要被分配角色的用户信息
      userInformation: {},
      // 所有角色的数据列表
      rolesList: [],
      // 选中的角色id
      selectedRoleId: ''
    }
  },
  created() {
    this.getUserList()
  },
  methods: {
    // getUserlist 就是一个查询函数 users是路径 后面是查询参数
    async getUserList() {
      const { data: res } = await this.$http.get('users', { params: this.queryInfo })
      if (res.meta.status !== 200) {
        return this.$message.error('获取用户列表失败')
      }
      this.userlist = res.data.users
      this.total = res.data.total
      console.log(res)
    },
    // @current-change这个函数已经监听到了size的变化然后赋值给handleSizeChange 此时的newSize 只是用于接收size的形参
    handleSizeChange(newSize) {
      this.queryInfo.pagesize = newSize
      this.getUserList()
    },
    handleCurrentChange(newPage) {
      this.queryInfo.pagenum = newPage
      this.getUserList()
    },
    // userInfo是接收(scope.row.mg_state)的形参
    async userStateChange(userInfo) {
      console.log(userInfo)
      const { data: res } = await this.$http.put(`users/${userInfo.id}/state/${userInfo.mg_state}`)
      if (res.meta.status !== 200) {
        userInfo.mg_state = !userInfo.mg_state
        return this.$message.error('用户状态更新失败')
      }
      this.$message.success('用户状态更新成功')
    },
    whenDialogFaded() {
      this.$refs.addFormRef.resetFields()
    },
    addUser() {
      this.$refs.addFormRef.validate(async valid => {
      // 如果不通过 不会继续操作
        if (!valid) return false
        // 如果通过 则发起添加请求 post函数会返回一个promise 故简化
        const { data: res } = await this.$http.post('users', this.addForm)
        if (res.meta.status !== 201) {
          this.$message.error('添加用户失败')
        }
        this.$message.success('添加用户成功')
        this.addDialogVisible = false
        this.getUserList()
      })
    },
    async showEditDialog(id) {
      const { data: res } = await this.$http.get('users/' + id)
      if (res.meta.status !== 200) {
        return this.$message.error('查询用户失败')
      }
      this.editForm = res.data
      this.editDialogVisible = true
    },
    editDialogClosed() {
      this.$refs.editFormRef.resetFields()
    },
    editUserInfo() {
      this.$refs.editFormRef.validate(async valid => {
        if (!valid) return false
        const { data: res } = await this.$http.put('users/' + this.editForm.id,
        // 将editForm中的数据上传到数据库 editForm与input双向绑定
          { email: this.editForm.email, mobile: this.editForm.mobile })
        if (res.meta.status !== 200) {
          return this.$message.error('更新用户信息失败')
        }
        this.editDialogVisible = false
        this.getUserList()
        this.$message.success('更新用户信息成功')
      })
    }, // $confirm的返回值是一个promise 所以需要用async和await来优化
    async removeUserById(id) {
      const confirmResult = await this.$confirm('此操作将永久删除该用户, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).catch(err => err) // catch 是为了接收用户取消后返回的错误信息然后return出去
      // 如果用户确认删除，则优化后的返回值是一个字符串 confirm
      if (confirmResult !== 'confirm') {
        return this.$message.info('已取消删除')
      }
      // 如果用户取消删除，则优化后的返回值是一个字符串 cancel
      const { data: res } = await this.$http.delete('users/' + id)
      if (res.meta.status !== 200) {
        return this.$message.error('删除用户失败')
      }
      this.$message.success('删除用户成功')
      this.getUserList()
    },
    async setRole(userInformation) {
      // this.userInformation代表data中定义的userInformation
      this.userInformation = userInformation
      // 在展示对话框之前，先获取所有角色列表
      const { data: res } = await this.$http.get('roles')
      if (res.meta.status !== 200) {
        return this.$message.error('获取角色列表失败')
      }
      // this.roleList就代表data中定义的rolesList，意思是将res.data赋值给data中定义的rolesList
      this.rolesList = res.data
      // 展示分配角色的对话框
      this.setRoleDialogVisible = true
    },
    // 点击按钮 分配角色
    async saveRoleInfo() {
      if (!this.selectedRoleId) {
        return this.$message.error('请选择要分配的角色')
      }
      const { data: res } = await this.$http.put(`users/${this.userInformation.id}/role`, { rid: this.selectedRoleId })
      if (res.meta.status !== 200) {
        return this.$message.error('更新角色失败')
      }
      this.$message.success('更新角色成功')
      this.getUserList()
      this.setRoleDialogVisible = false
    },
    // 监听分配角色对话框的关闭事件
    setRoleDialogClosed() {
      this.selectedRoleId = ''
      this.userInformation = {}
    }
  }
}
</script>

<style lang="less" scoped>
</style>
