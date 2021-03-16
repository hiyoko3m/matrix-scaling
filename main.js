const app = Vue.createApp({
    data() {
        return {
            row_num: 3,
            column_num: 3,
            matrix: [[1, 1, 1], [0, 1, 0], [0, 0, 1]],
        }
    },
    methods: {
        create_matrix() {
            this.matrix = [[1, 0], [0, 1]]
        },
        row_scaling() {
            this.matrix = this.matrix.map(
                row => {
                    const s = row.reduce((sum, value) => sum + value, 0);
                    return row.map(x => x / s);
                }
            )
        },
        column_scaling() {
            const s = this.matrix.reduce(
                (sum, row) => sum.map((x, i) => x + row[i]),
                Array(this.matrix[0].length).fill(0)
            );
            this.matrix = this.matrix.map(
                row => row.map((value, i) => value / s[i])
            );
        },
    },
})

const vm = app.mount('#app')
