<template>
  <div>
    <!-- 面包屑导航区 -->
    <el-breadcrumb separator="/">
    <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
    <el-breadcrumb-item>商品管理</el-breadcrumb-item>
    <el-breadcrumb-item>参数列表</el-breadcrumb-item>
    </el-breadcrumb>
    <!-- 卡片视图区 -->
    <el-card>
      <el-alert title="注意:只允许为第三极分类设置相关参数!" type="warning" :closable="false" show-icon></el-alert>
      <!-- 选择商品分类区域 -->
      <el-row class="cat_opt">
        <el-col>
          <span>选择商品分类: </span>
          <!-- 级联选择框 -->
          <!-- options用来指定数据源 props用来指定配置对象 v-model是把选中的值双向绑定到data中 -->
          <el-cascader
            ref="cascaderHandle"
            v-model="selectedCateKeys"
            :options="cateList"
            :props="cateProps"
            @change="handleChanged" clearable>
          </el-cascader>
        </el-col>
      </el-row>
      <!-- tab页区 -->
      <el-tabs v-model="activeName" @tab-click="handleTabClick">
        <el-tab-pane label="动态参数" name="many">
          <el-button type="primary" size="mini" :disabled="isBtnDisabled" @click="addDialogVisible=true">添加参数</el-button>
          <!-- 渲染动态数据的表格 -->
          <!-- 在给manyTabData赋值之前已经把res.data中的attr_vals变成了数组 -->
          <el-table :data="manyTabData" border stripe>
            <el-table-column type="expand">
              <template slot-scope="scope">
                <el-tag v-for="(item, i) in scope.row.attr_vals" :key="i" closable @close="handleClose(i, scope.row)">{{item}}</el-tag>
                <el-input
                  class="input-new-tag"
                  v-if="scope.row.inputVisible"
                  v-model="scope.row.inputValue"
                  ref="saveTagInput"
                  size="small"
                  @keyup.enter.native="handleInputConfirm(scope.row)"
                  @blur="handleInputConfirm(scope.row)">
                </el-input>
                <el-button v-else class="button-new-tag" size="small" @click="showInput(scope.row)">+ New Tag</el-button>
              </template>
            </el-table-column>
            <el-table-column type="index"></el-table-column>
            <el-table-column label="参数名称" prop="attr_name"></el-table-column>
            <el-table-column label="操作">
              <template slot-scope="scope">
                <el-button type="primary" icon="el-icon-edit" size="mini" @click="showEditDialog(scope.row.attr_id)">编辑</el-button>
                <el-button type="danger" icon="el-icon-delete" size="mini" @click="removeParams(scope.row.attr_id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="静态属性" name="only">
          <el-button type="primary" size="mini" :disabled="isBtnDisabled" @click="addDialogVisible=true">添加属性</el-button>
          <!-- 渲染静态数据的表格 -->
          <el-table :data="onlyTabData" border stripe>
            <el-table-column type="expand">
              <template slot-scope="scope">
                <el-tag v-for="(item, i) in scope.row.attr_vals" :key="i" closable @close="handleClose(i, scope.row)">{{item}}</el-tag>
                <el-input
                  class="input-new-tag"
                  v-if="scope.row.inputVisible"
                  v-model="scope.row.inputValue"
                  ref="saveTagInput"
                  size="small"
                  @keyup.enter.native="handleInputConfirm(scope.row)"
                  @blur="handleInputConfirm(scope.row)">
                </el-input>
                <el-button v-else class="button-new-tag" size="small" @click="showInput(scope.row)">+ New Tag</el-button>
              </template>
            </el-table-column>
            <el-table-column type="index"></el-table-column>
            <el-table-column label="属性名称" prop="attr_name"></el-table-column>
            <el-table-column label="操作">
              <template slot-scope="scope">
                <el-button type="primary" icon="el-icon-edit" size="mini" @click="showEditDialog(scope.row.attr_id)">编辑</el-button>
                <el-button type="danger" icon="el-icon-delete" size="mini" @click="removeParams(scope.row.attr_id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          </el-tab-pane>
      </el-tabs>
    </el-card>
    <!-- 对话框区 -->
    <el-dialog
      :title="'添加' + titleText"
      :visible.sync="addDialogVisible"
      width="50%" @close="addDialogClosed">
      <el-form :model="addForm" :rules="addFormRules" ref="addFormRef" label-width="100px">
        <el-form-item :label="titleText" prop="attr_name">
          <el-input v-model="addForm.attr_name"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="addDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="addParams">确 定</el-button>
      </span>
    </el-dialog>
    <!-- 修改参数的对话框 -->
    <el-dialog
      :title="'修改' + titleText"
      :visible.sync="editDialogVisible"
      width="50%" @close="editDialogClosed">
      <el-form :model="editForm" :rules="editFormRules" ref="editFormRef" label-width="100px">
        <el-form-item :label="titleText" prop="attr_name">
          <el-input v-model="editForm.attr_name"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="editDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="editParams">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      // 存放商品列表数据
      cateList: [],
      // 级联选择框双向绑定的id值存放在此
      selectedCateKeys: [],
      // 级联选择框的配置属性 用来读取cateList中的数据 并以下面的规则解析渲染出来 其中value是鼠标选中的、对应服务器的值 label是指所看到的字符 children是指通过何种方式实现嵌套
      cateProps: {
        checkStrictly: true,
        expandTrigger: 'hover',
        value: 'cat_id',
        label: 'cat_name',
        children: 'children'
      },
      // 默认选中的标签 因为有两个标签 当选中第二个标签时这里会变成only 因为通过双向绑定将值传递在此
      activeName: 'many',
      // 获取到的动态参数数据
      manyTabData: [],
      // 获取到的静态参数数据
      onlyTabData: [],
      addDialogVisible: false,
      editDialogVisible: false,
      // 将要发送给服务器的表单数据(新添加)
      addForm: {
        attr_name: ''
      },
      // 将要发送给服务器的表单数据(修改后)
      editForm: {
      },
      // 发送前的表单数据验证规则对象(新添加)
      addFormRules: {
        attr_name: [{
          required: true, message: '请输入参数名称', trigger: 'blur'
        }]
      },
      // 发送前的表单数据验证规则对象(修改后)
      editFormRules: {
        attr_name: [{
          required: true, message: '请输入参数名称', trigger: 'blur'
        }]
      }
    }
  },
  created() {
    this.getCateList()
  },
  methods: {
    // 获取所有的商品分类列表
    async getCateList() {
      const { data: res } = await this.$http.get('categories')
      if (res.meta.status !== 200) {
        return this.$message.error('获取列表失败')
      }
      this.cateList = res.data
      console.log(res.data)
    },
    // 级联选择框变化时触发此函数
    async handleChanged() {
      this.getParamsData()
    },
    // tab页点击事件触发此函数
    handleTabClick() {
      this.getParamsData()
    },
    // 三级分类下的所有参数列表
    async getParamsData() {
      // 如果数组的长度不等于3 则证明没有选中三级分类 此时强制清空数组
      if (this.selectedCateKeys.length !== 3) {
        this.selectedCateKeys = []
        this.manyTabData = []
        this.onlyTabData = []
        this.$refs.cascaderHandle.dropDownVisible = false
        return false
      }
      // 如果没有return 则证明选中了三级分类
      this.$refs.cascaderHandle.dropDownVisible = false
      // 根据选中的id 向服务器发送请求
      const { data: res } = await this.$http.get(`categories/${this.cateId}/attributes`, { params: { sel: this.activeName } })
      if (res.meta.status !== 200) {
        return this.$message.error('获取参数列表失败')
      }
      // 每一次循环都会得到一个item（可自己命名）,将这个item作为参数传递给下一个函数
      res.data.forEach(item => {
        // 三元表达式固定写法:表达式 (expr1) ? (expr2) : (expr3)
        // 在 expr1 求值为 TRUE 时执行 expr2，在 expr1 求值为 FALSE 时执行 expr3
        item.attr_vals = item.attr_vals
          ? item.attr_vals.split(' ') : []
          // 给所有的获取到的参数添加自己的inputVisible和inputValue属性 可以解决多行数据共用一个布尔值出现数据联动的情况
        item.inputVisible = false
        item.inputValue = ''
      })
      console.log(res.data)
      if (this.activeName === 'many') {
        this.manyTabData = res.data
      } else {
        this.onlyTabData = res.data
      }
    },
    addDialogClosed() {
      this.$refs.addFormRef.resetFields()
    },
    addParams() {
      this.$refs.addFormRef.validate(async valid => {
        if (!valid) return false
        const { data: res } = await this.$http.post(`categories/${this.cateId}/attributes`, {
          attr_name: this.addForm.attr_name,
          attr_sel: this.activeName
        })
        if (res.meta.status !== 201) {
          return this.$message.error('添加参数失败')
        }
        this.$message.success('添加参数成功')
        this.addDialogVisible = false
        this.getParamsData()
      })
    },
    async showEditDialog(attrId) {
      // attrId是对应scope.row.attr_id的形参 它代表的是当前参数的id
      const { data: res } = await this.$http.get(`categories/${this.cateId}/attributes/${attrId}`, { params: { attr_sel: this.activeName } })
      if (res.meta.status !== 200) {
        return this.$message.error('获取参数失败')
      }
      this.editForm = res.data
      this.editDialogVisible = true
    },
    editDialogClosed() {
      // 关闭就清空
      this.$refs.addFormRef.resetFields()
    },
    editParams() {
      // 回调函数：一个函数可以作为参数传递给另一个函数叫做回调函数，回调函数名可任意
      // validate是一个回调函数是element-ui封装好的用于对整个表单进行验证validate的参数是一个回调函数,该回调函数可以自己命名
      // 该回调函数在校验结束后被调用，是否校验成功和未通过校验的字段。若不传入回调函数，则会返回promise
      // 箭头函数：当只有一个参数时，圆括号是可选的(单一参数) => {函数声明} 或 单一参数 => {函数声明}
      // 没有参数的函数应该写成一对圆括号: () => {函数声明}
      // 如果函数部分只是一个语句，则可以省略 return 关键字和大括号 {} 例如：params1 => 100 代表返回值是100
      this.$refs.editFormRef.validate(async valid => {
        if (!valid) return
        const { data: res } = await this.$http.put(`categories/${this.cateId}/attributes/${this.editForm.attr_id}`,
          { attr_name: this.editForm.attr_name, attr_sel: this.activeName })
        if (res.meta.status !== 200) {
          return this.$message.error('修改参数失败')
        }
        this.$message.success('修改参数成功')
        this.getParamsData()
        this.editDialogVisible = false
      })
    },
    async removeParams(attrId) {
      const confirmResult = await this.$confirm(
        '此操作将永久删除该参数, 是否继续?', '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).catch(err => {
        return err
      })
      if (confirmResult !== 'confirm') {
        return this.$message.info('已取消删除')
      }
      const { data: res } = await this.$http.delete(`categories/${this.cateId}/attributes/${attrId}`)
      if (res.meta.status !== 200) {
        return this.$message.error('删除参数失败')
      }
      this.$message.success('删除参数成功')
      this.getParamsData()
    },
    // 文本框失去焦点或按下了enter键会触发此函数
    async handleInputConfirm(row) {
      if (row.inputValue.trim().length === 0) {
        row.inputValue = ''
        row.inputVisible = false
        return false
      }
      // 若没有return则发起请求
      row.attr_vals.push(row.inputValue.trim())
      row.inputValue = ''
      row.inputVisible = false
      this.saveAttrValues(row)
    },
    showInput(row) {
      row.inputVisible = true
      // 让文本框自动获得焦点
      // $nextTick的作用：当把布尔值变成true时 文本框是没有被立刻渲染出来的 此时需要等待下一步，把input输入框渲染出来之后再调用focus函数，否则focus函数没有作用对象
      this.$nextTick(_ => {
        this.$refs.saveTagInput.$refs.input.focus()
      })
    },
    async handleClose(i, row) {
      // 当前的tag标签关闭时就将此标签的i传过来 根据当前行的数据找到对应的i进行删除
      row.attr_vals.splice(i, 1)
      this.saveAttrValues(row)
    },
    async saveAttrValues(row) {
      const { data: res } = await this.$http.put(`categories/${this.cateId}/attributes/${row.attr_id}`, {
        attr_name: row.attr_name,
        attr_sel: row.attr_sel,
        attr_vals: row.attr_vals.join(' ')
      })
      if (res.meta.status !== 200) {
        return this.$message.error('修改参数项失败')
      }
      this.$message.success('修改参数项成功')
    }
  },
  computed: {
    isBtnDisabled() {
      // 如果按钮需要被禁用 则返回true 否则返回 false
      if (this.selectedCateKeys.length !== 3) {
        return true
      }
      return false
    },
    // 当前选中的三级分类的id 如果选中了 则返回数组的最后一位 也就是三级id
    cateId() {
      if (this.selectedCateKeys.length === 3) {
        return this.selectedCateKeys[2]
      }
      return null
    },
    // 动态计算对话框标题的文本
    titleText() {
      if (this.activeName === 'many') {
        return '动态参数'
      }
      return '静态属性'
    }
  }
}
</script>

<style lang="less" scoped>
.cat_opt {
  margin-top: 15px;
}
.el-tag {
  margin: 5px;
}
.input-new-tag {
  width: 120px;
}
</style>
