import Vue from 'vue'
import Router from 'vue-router'
import HelloWorld from '@/components/HelloWorld'
import Restaurant from '@/components/Restaurant.vue'
Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Restaurant',
      component: Restaurant
    }
  ]
})
