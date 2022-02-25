<template>
  <div>
    <!-- 面包屑导航区 -->
    <el-breadcrumb separator="/">
    <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
    <el-breadcrumb-item>商品管理</el-breadcrumb-item>
    <el-breadcrumb-item>添加商品</el-breadcrumb-item>
    </el-breadcrumb>
    <!-- 卡片视图区 -->
    <el-card>
      <el-alert title="添加商品信息" type="info" center show-icon :closable="false"></el-alert>
      <el-steps :active="activeIndex - 0" finish-status="success" align-center>
        <el-step title="基本信息"></el-step>
        <el-step title="商品参数"></el-step>
        <el-step title="商品属性"></el-step>
        <el-step title="商品图片"></el-step>
        <el-step title="商品内容"></el-step>
        <el-step title="完成"></el-step>
      </el-steps>
      <!-- tab区 -->
      <el-form :model="addForm" :rules="addFormRules" ref="addFormRef" label-width="100px" label-position="top">
        <el-tabs v-model="activeIndex" :tab-position="'left'" :before-leave="beforeTabLeave" @tab-click="tabClicked">
          <el-tab-pane label="基本信息" name="0">
            <el-form-item label="商品名称" prop="goods_name">
              <el-input v-model="addForm.goods_name"></el-input>
            </el-form-item>
            <el-form-item label="商品价格" prop="goods_price">
              <el-input v-model="addForm.goods_price" type="number"></el-input>
            </el-form-item>
            <el-form-item label="商品重量" prop="goods_weight">
              <el-input v-model="addForm.goods_weight" type="number"></el-input>
            </el-form-item>
            <el-form-item label="商品数量" prop="goods_number">
              <el-input v-model="addForm.goods_number" type="number"></el-input>
            </el-form-item>
            <el-form-item label="商品分类" prop="cateProps">
              <el-cascader
                ref="cascaderHandle"
                v-model="addForm.goods_cat"
                :options="cateList"
                :props="cateProps"
                @change="handleChanged" clearable>
              </el-cascader>
            </el-form-item>
          </el-tab-pane>
          <el-tab-pane label="商品参数" name="1">
            <el-form-item :label="item.attr_name" v-for="item in manyTableData" :key="item.attr_id">
              <el-checkbox-group v-model="item.attr_vals">
                <el-checkbox :label="cb" v-for="(cb, i) in item.attr_vals" :key="i" border></el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-tab-pane>
          <el-tab-pane label="商品属性" name="2">
            <el-form-item :label="item.attr_name" v-for="item in onlyTableData" :key="item.attr_id">
              <el-input v-model="item.attr_vals"></el-input>
            </el-form-item>
          </el-tab-pane>
          <el-tab-pane label="商品图片" name="3">
            <!-- action 表示图片要上传到后台的API地址 -->
            <el-upload
              action="http://127.0.0.1:8888/api/private/v1/upload"
              :on-preview="handlePreview"
              :on-remove="handleRemove"
              list-type="picture"
              :headers="headerObj"
              :on-success="handleSuccess">
              <el-button size="small" type="primary">点击上传</el-button>
              <div slot="tip" class="el-upload__tip">只能上传jpg/png文件,且不超过500kb</div>
            </el-upload>
          </el-tab-pane>
          <el-tab-pane label="商品内容" name="4">
            <quill-editor v-model="addForm.goods_introduce"></quill-editor>
            <el-button type="primary" class="btnAdd" @click="addGoods">添加商品</el-button>
          </el-tab-pane>
        </el-tabs>
      </el-form>
    </el-card>
    <!-- 对话框区 -->
    <el-dialog
      title="图片预览"
      :visible.sync="previewVisible"
      width="50%">
      <img :src="previewPath" alt="" class="previewImg">
    </el-dialog>
  </div>
</template>

<script>
// 先安装依赖 然后在此引入lodash
import _ from 'lodash'
export default {
  data() {
    return {
      // 是数组还是对象取决于接口文档的写法
      cateList: [],
      activeIndex: '0',
      addForm: {
        goods_name: '',
        goods_price: 0,
        goods_weight: 0,
        goods_number: 0,
        goods_cat: [],
        pics: [],
        goods_introduce: '',
        attrs: []
      },
      addFormRules: {
        goods_name: [{ required: true, message: '请输入内容', trigger: 'blur' }],
        goods_price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
        goods_weight: [{ required: true, message: '请输入重量', trigger: 'blur' }],
        goods_number: [{ required: true, message: '请输入数量', trigger: 'blur' }]
      },
      cateProps: {
        checkStrictly: true,
        expandTrigger: 'hover',
        value: 'cat_id',
        label: 'cat_name',
        children: 'children'
      },
      manyTableData: [],
      onlyTableData: [],
      // 上传组件没有调用本地的axios导致token无效 所以上传前需要为其指定Authorization
      headerObj: {
        Authorization: window.sessionStorage.getItem('token')
      },
      previewPath: '',
      previewVisible: false
    }
  },
  created() {
    this.getCateList()
  },
  methods: {
    async getCateList() {
      const { data: res } = await this.$http.get('categories')
      if (res.meta.status !== 200) {
        return this.$message.error('获取商品列表失败')
      }
      this.cateList = res.data
    },
    // 级联选择框变化时触发此函数
    handleChanged() {
      if (this.addForm.goods_cat.length !== 3) {
        this.addForm.goods_cat = []
        this.$refs.cascaderHandle.dropDownVisible = false
      }
      this.$refs.cascaderHandle.dropDownVisible = false
    },
    beforeTabLeave(activeName, oldActiveName) {
      if (this.addForm.goods_cat.length !== 3 && oldActiveName === '0') {
        this.$message.error('请先选择商品分类')
        return false
      }
    },
    async tabClicked() {
      // 如果activeIndex为1 则证明访问的是动态参数面板
      if (this.activeIndex === '1') {
        const { data: res } = await this.$http.get(`categories/${this.cateId}/attributes`, { params: { sel: 'many' } })
        if (res.meta.status !== 200) {
          return this.$message.error('获取动态参数失败')
        }
        // 每循环一次可以得到一个item split() 把一个字符串分割成字符串数组 三元表达式 如果字符串为空则直接返回空数组
        res.data.forEach(item => {
          // item.attr_vals被重新赋值 值为数组
          item.attr_vals =
          item.attr_vals === 0 ? []
            : item.attr_vals.split(' ')
        })
        this.manyTableData = res.data
        console.log(this.manyTableData)
      } else if (this.activeIndex === '2') {
        const { data: res } = await this.$http.get(`categories/${this.cateId}/attributes`, { params: { sel: 'only' } })
        if (res.meta.status !== 200) {
          return this.$message.error('获取动态参数失败')
        }
        this.onlyTableData = res.data
      }
    },
    // 处理图片预览效果
    handlePreview(file) {
      this.previewPath = file.response.data.url
      this.previewVisible = true
    },
    // 处理移除图片的操作
    handleRemove(file) {
      // 1.获取将要删除的图片的临时路径
      const filePath = file.response.data.tmp_path
      // 2.从pics数组中，找到这个图片对应的索引值 x代表pics数组中的每一项 如果x等于filePath则返回此项x
      const i = this.addForm.pics.findIndex(x => x.pic === filePath)
      // 3.调用数组的splice方法，把图片信息对象，从pics中移除
      this.addForm.pics.splice(i, 1)
    },
    handleSuccess(response) {
      // 1. 创建一个图片信息对象
      const picInfo = { pic: response.data.tmp_path }
      // 2. 将图片信息对象push到pics数组中
      this.addForm.pics.push(picInfo)
    },
    addGoods() {
      this.$refs.addFormRef.validate(async valid => {
        if (!valid) {
          return this.$message.error('请填写商品的必填项')
        }
        // 先进行深拷贝addForm这个对象 然后赋值给一个新的form
        const form = _.cloneDeep(this.addForm)
        // 然后再把form（此时和原数据相同，但互不影响）里面的goods_cat（此时是数组）转换成字符串，再赋值给一个新的goods_cat（此时是字符串）
        form.goods_cat = form.goods_cat.join(',')
        // 处理动态参数 接口文档中规定 传过去的参数attrs必须是一个数组中包含两个对象一个动态 一个静态各是一个对象 因为manyTableData中的attr_id是一个常量 attr_value是一个数组 所以需要新建一个对象包含二者 此外还需将attr_value从数组转换成字符串所以调用join方法
        this.manyTableData.forEach(item => {
          const nweInfo = { attr_id: item.attr_id, attr_value: item.attr_vals.join(' ') }
          this.addForm.attrs.push(nweInfo)
        })
        // 处理静态参数 原理和动态参数数据相同 只不过onlyTableData中的attr_vals本身就是字符串所以不需其他操作
        this.onlyTableData.forEach(item => {
          const nweInfo = { attr_id: item.attr_id, attr_value: item.attr_vals }
          this.addForm.attrs.push(nweInfo)
        })
        // 处理好两个对象后 将其赋值给form 因为最后提交时提交form
        form.attrs = this.addForm.attrs
        const { data: res } = await this.$http.post('goods', form)
        if (res.meta.status !== 201) {
          return this.$message.error('添加商品失败')
        }
        this.$message.success('添加商品成功')
        this.$router.push('/104')
      })
    }
  },
  computed: {
    cateId() {
      if (this.addForm.goods_cat.length === 3) {
        return this.addForm.goods_cat[2]
      }
      return null
    }
  }
}
</script>

<style lang="less" scoped>
.el-checkbox {
  margin: 0 10px 0 0 !important;
}
.previewImg {
  width: 100%;
}
.btnAdd {
  margin-top: 15px;
}
</style>
