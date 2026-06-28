Component({
  properties: {
    value: {
      type: Number,
      value: 60
    }
  },

  data: {
    expanded: false
  },

  methods: {
    onToggle() {
      this.setData({ expanded: !this.data.expanded })
    },

    onInput(e) {
      const val = parseInt(e.detail.value) || 0
      this.triggerEvent('change', { value: val })
    }
  }
})
