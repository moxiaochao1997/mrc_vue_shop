<template>
  <div>
    <!-- 面包屑导航区 -->
    <el-breadcrumb separator="/">
    <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
    <el-breadcrumb-item>数据统计</el-breadcrumb-item>
    <el-breadcrumb-item>数据报表</el-breadcrumb-item>
    </el-breadcrumb>
    <el-card>
      <!-- 2.为Echarts准备一个div -->
      <div id="main" style="width: 1000px; height: 400px"></div>
    </el-card>
  </div>
</template>

<script>
// 1.先导入此插件
import echarts from 'echarts'
import _ from 'lodash'
export default {
  data() {
    return {
      options: {
        title: {
          text: '用户来源'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            label: {
              backgroundColor: '#E9EEF3'
            }
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: [
          {
            boundaryGap: false
          }
        ],
        yAxis: [
          {
            type: 'value'
          }
        ]
      }
    }
  },
  // created 是指页面元素(DOM)还没有创建之前的动作
  created() {},
  // mounted 是指页面上的元素(DOM)创建之后的动作
  async mounted() {
    // 3.必须在dom创建之后才能初始化echarts
    var myChart = echarts.init(document.getElementById('main'))
    // 获取图表数据
    const { data: res } = await this.$http.get('reports/type/1')
    if (res.meta.status !== 200) {
      return this.$message.error('获取图表数据失败')
    }
    // 4.准备数据和配置项 合并两个对象用到merge方法 如果不合并则会缺少鼠标移动时的效果
    const result = _.merge(res.data, this.options)
    // 5.展示数据
    myChart.setOption(result)
  },
  methods: {}
}
</script>

<style lang="less" scoped>

</style>
