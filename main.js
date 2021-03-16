const app = Vue.createApp({
    data() {
        return {
            row_num: 3,
            column_num: 3,
            matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
        }
    },
    methods: {
        create_matrix() {
            this.matrix = [[1, 0], [0, 1]]
        },
        row_scaling() {
        },
        column_scaling() {
        },
    },
})

const vm = app.mount('#app')
