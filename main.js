const app = Vue.createApp({
    data() {
        return {
            row_num: 3,
            input_row_num: "3",
            column_num: 3,
            input_column_num: "3",
            matrix: [[1, 1, 1], [0, 1, 0], [0, 0, 1]],
        }
    },
    methods: {
        reset_matrix() {
            this.row_num = parseInt(this.input_row_num);
            this.column_num = parseInt(this.input_column_num);
            this.matrix = Array(this.row_num);
            for (let i = 0; i < this.matrix.length; i++) {
                this.matrix[i] = Array(this.column_num).fill(0);
                this.matrix[i][Math.min(i, this.column_num - 1)] = 1;
            }
            for (let i = this.row_num; i < this.column_num; i++) {
                this.matrix[this.row_num - 1][i] = 1;
            }
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
