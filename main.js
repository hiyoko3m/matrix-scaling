const INITIAL_STATE = 0;
const AFTER_ROW_SCALING = 1;
const AFTER_COLUMN_SCALING = -1;

const AUTO_OFF = 0;
const AUTO_ON = 1;

const app = Vue.createApp({
    data() {
        return {
            inputRowNum: "3",
            rowNum: 3,

            inputColumnNum: "3",
            columnNum: 3,

            inputMatrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
            matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
            editorX: 0,
            editorY: 0,
            isEditing: false,
            editingRowIndex: null,
            editingColumnIndex: null,
            editingValue: null,
            
            scalingStatus: INITIAL_STATE,
            rowScalingNum: 0,
            columnScalingNum: 0,

            autoStatus: AUTO_OFF,
            autoInterval: 1000,
            autoId: null,
        }
    },
    methods: {
        escapeGlobal() {
            if (this.isEditing) {
                this.escapeFromEdit();
            }
        },

        // Clear the input matrix and reset the base matrix
        clearMatrix() {
            // Set rowNum and columnNum correctly
            // and reflect them back to inputRowNum and inputColumnNum.
            this.rowNum = parseInt(this.inputRowNum);
            if (this.rowNum <= 0) {
                this.rowNum = 1;
            }
            this.inputRowNum = this.rowNum;

            this.columnNum = parseInt(this.inputColumnNum);
            if (this.columnNum <= 0) {
                this.columnNum = 1;
            }
            this.inputColumnNum = this.columnNum;

            // Initialize `inputMatrix` as the identity matrix
            // if rowNum and columnNum coincide. Otherwise
            // initialize as a near identity matrix
            // not to become the sum of each row and column as 0.
            this.inputMatrix = Array(this.rowNum);
            for (let i = 0; i < this.rowNum; i++) {
                this.inputMatrix[i] = Array(this.columnNum).fill(0);
                this.inputMatrix[i][Math.min(i, this.columnNum - 1)] = 1;
            }
            for (let i = this.rowNum; i < this.columnNum; i++) {
                this.inputMatrix[this.rowNum - 1][i] = 1;
            }

            this.resetMatrix();

            this.scalingStatus = INITIAL_STATE;
            this.rowScalingNum = 0;
            this.columnScalingNum = 0;
        },
        // Reset the initial matrix based on the input matrix
        resetMatrix() {
            this.matrix = Array(this.rowNum);
            for (let i = 0; i < this.rowNum; i++) {
                this.matrix[i] = [...this.inputMatrix[i]];
            }
        },
        changeToEdit(rowIndex, columnIndex, event) {
            this.editorX = event.pageX;
            this.editorY = event.pageY;

            this.isEditing = true;
            this.editingRowIndex = rowIndex;
            this.editingColumnIndex = columnIndex;
            this.editingValue = this.inputMatrix[rowIndex][columnIndex];

            this.$nextTick(() => {
                this.$refs.matrixEditor.focus();
                this.$refs.matrixEditor.select()
            });
        },
        escapeFromEdit() {
            this.isEditing = false;
        },
        edit() {
            this.inputMatrix[this.editingRowIndex][this.editingColumnIndex] = parseInt(this.editingValue);
            this.escapeFromEdit();

            this.resetScaling();
        },

        rowScaling() {
            if (this.scalingStatus === AFTER_ROW_SCALING) {
                return;
            }

            this.matrix = this.matrix.map(
                row => {
                    // The `s` is the sum of each row.
                    const s = row.reduce((sum, value) => sum + value, 0);
                    return row.map(x => x / s);
                }
            )

            this.scalingStatus = AFTER_ROW_SCALING;
            this.rowScalingNum += 1;
        },
        columnScaling() {
            if (this.scalingStatus === AFTER_COLUMN_SCALING) {
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

            this.scalingStatus = AFTER_COLUMN_SCALING;
            this.columnScalingNum += 1;
        },
        toggleAutoScaling() {
            if (this.autoStatus === AUTO_OFF) {
                this.autoId = setInterval(() => {
                    if (this.scalingStatus !== AFTER_ROW_SCALING) {
                        this.rowScaling();
                    } else {
                        this.columnScaling();
                    }
                }, this.autoInterval)
                this.autoStatus = AUTO_ON;
            } else {
                clearInterval(this.autoId);
                this.autoId = null;
                this.autoStatus = AUTO_OFF;
            }
        },
        changeAutoInterval(event) {
            this.autoInterval = event.target.value;
            console.log(this.autoInterval);
            if (this.autoStatus === AUTO_ON) {
                this.toggleAutoScaling();
                this.toggleAutoScaling();
            }
        },
        resetScaling() {
            if (this.autoStatus === AUTO_ON) {
                this.toggleAutoScaling();
            }
            this.rowScalingNum = 0;
            this.columnScalingNum = 0;

            this.resetMatrix();
        },
    },
    computed: {
        canRowScale() {
            return this.autoStatus === AUTO_OFF
                && this.scalingStatus !== AFTER_ROW_SCALING;
        },
        canColumnScale() {
            return this.autoStatus === AUTO_OFF
                && this.scalingStatus !== AFTER_COLUMN_SCALING;
        },
    },
})

const vm = app.mount('#app')
