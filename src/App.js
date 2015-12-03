import Vue from 'vue'
import Revue from './revue'
import store from './store'
Vue.use(Revue, {
  store
})
if (__DEV__) {
  window.Vue = Vue
  window.ReduxStore = store
}
new Vue({
  el: '#app',
  data () {
    return {
      todos: this.$revue.getState().todos,
      todo: ''
    }
  },
  ready () {
    this.$subscribe('todos')
  },
  methods: {
    toggleTodo (index) {
      this.$revue.dispatch({type: 'TOGGLE_TODO', index})
    },
    addTodo () {
      if (!this.todo)
        return
      this.$revue.dispatch({type: 'ADD_TODO', text: this.todo})
      this.todo = ''
    },
  }
})

new Vue({
  el: '.read',
  data () {
    return {
      rtodos: [],
      title: 'read only todos',
      lifesong: 'I\'m alive'
    }
  },
  ready () {
    this.$subscribe('todos as rtodos')
  },
  methods: {
    // this is just for test, no need in production
    handleUnsubcribe () {
      this.$unsubscribe()
    },
    handleDestroy () {
      this.lifesong = 'I\'m dead'
      setTimeout(() => {
        this.$destroy()
      }, 200)
    }
  }
})
