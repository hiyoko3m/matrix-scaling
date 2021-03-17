const INITIAL_STATE = 0;
const AFTER_ROW_SCALING = 1;
const AFTER_COLUMN_SCALING = -1;

const AUTO_OFF = 0;
const AUTO_ON = 1;

const app = Vue.createApp({
    data() {
        return {
            input_row_num: "3",
            row_num: 3,

            input_column_num: "3",
            column_num: 3,

            input_matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
            matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
            
            scaling_status: INITIAL_STATE,
            row_scaling_num: 0,
            column_scaling_num: 0,

            auto_status: AUTO_OFF,
            auto_interval: 1000,
            auto_id: null,
        }
    },
    methods: {
        // Clear the input matrix and reset the base matrix
        clear_matrix() {
            // Set row_num and column_num correctly
            // and reflect them back to input_row_num and input_column_num.
            this.row_num = parseInt(this.input_row_num);
            if (this.row_num <= 0) {
                this.row_num = 1;
            }
            this.input_row_num = this.row_num;

            this.column_num = parseInt(this.input_column_num);
            if (this.column_num <= 0) {
                this.column_num = 1;
            }
            this.input_column_num = this.column_num;

            // Initialize `input_matrix` as the identity matrix
            // if row_num and column_num coincide. Otherwise
            // initialize as a near identity matrix
            // not to become the sum of each row and column as 0.
            this.input_matrix = Array(this.row_num);
            for (let i = 0; i < this.row_num; i++) {
                this.input_matrix[i] = Array(this.column_num).fill(0);
                this.input_matrix[i][Math.min(i, this.column_num - 1)] = 1;
            }
            for (let i = this.row_num; i < this.column_num; i++) {
                this.input_matrix[this.row_num - 1][i] = 1;
            }

            this.reset_matrix();

            this.scaling_status = INITIAL_STATE;
            this.row_scaling_num = 0;
            this.column_scaling_num = 0;
        },
        // Reset the base matrix to the input matrix
        reset_matrix() {
            this.matrix = Array(this.row_num);
            for (let i = 0; i < this.row_num; i++) {
                this.matrix[i] = [...this.input_matrix[i]];
            }
        },

        row_scaling() {
            if (this.scaling_status === AFTER_ROW_SCALING) {
                return;
            }

            this.matrix = this.matrix.map(
                row => {
                    // The `s` is the sum of each row.
                    const s = row.reduce((sum, value) => sum + value, 0);
                    return row.map(x => x / s);
                }
            )

            this.scaling_status = AFTER_ROW_SCALING;
            this.row_scaling_num += 1;
        },
        column_scaling() {
            if (this.scaling_status === AFTER_COLUMN_SCALING) {
                return;
            }

            // The `s` is the array having the sum of each column.
            const s = this.matrix.reduce(
                (sum, row) => sum.map((x, i) => x + row[i]),
                Array(this.matrix[0].length).fill(0)
            );
            this.matrix = this.matrix.map(
                row => row.map((value, i) => value / s[i])
            );

            this.scaling_status = AFTER_COLUMN_SCALING;
            this.column_scaling_num += 1;
        },
        toggle_auto_scaling() {
            if (this.auto_id === null) {
                this.auto_id = setInterval(() => {
                    if (this.scaling_status !== AFTER_ROW_SCALING) {
                        this.row_scaling();
                    } else {
                        this.column_scaling();
                    }
                }, this.auto_interval)
                this.auto_status = AUTO_ON;
            } else {
                clearInterval(this.auto_id);
                this.auto_id = null;
                this.auto_status = AUTO_OFF;
            }
        },
        reset_scaling() {
            if (this.auto_id !== null) {
                toggle_auto_scaling();
            }
            this.row_scaling_num = 0;
            this.column_scaling_num = 0;

            reset_matrix();
        },
    },
})

const vm = app.mount('#app')
