const INITIAL_STATE = 0;
const AFTER_ROW_SCALING = 1;
const AFTER_COLUMN_SCALING = -1;

const AUTO_OFF = 0;
const AUTO_ON = 1;

const app = Vue.createApp({
    data() {
        return {
            // for input
            inputRowNum: "3",
            rowNum: 3,

            inputColumnNum: "3",
            columnNum: 3,

            inputMatrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
            editorX: 0,
            editorY: 0,
            isEditing: false,
            editingRowIndex: null,
            editingColumnIndex: null,
            editingValue: null,
            
            // for matrix scaling
            matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],

            scalingStatus: INITIAL_STATE,
            rowScalingNum: 0,
            columnScalingNum: 0,

            autoStatus: AUTO_OFF,
            autoInterval: 100,
            autoIntervalSlider: 1,
            autoId: null,

            // for symmetric capacity
            leftVar: [1, 1, 1],
            rightVar: [1, 1, 1],

            // for visualizing
            resultPrecision: 5,
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

            this.resetScaling();
            this.resetSymCap();
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
            this.resetSymCap();
        },

        rowScaling() {
            if (this.scalingStatus === AFTER_ROW_SCALING) {
                return;
            }

            this.matrix = this.matrix.map(
                (row, i) => row.map(x => x / this.rowSum[i])
            );

            this.scalingStatus = AFTER_ROW_SCALING;
            this.rowScalingNum += 1;
        },
        columnScaling() {
            if (this.scalingStatus === AFTER_COLUMN_SCALING) {
                return;
            }

            this.matrix = this.matrix.map(
                row => row.map((value, i) => value / this.columnSum[i])
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
            if (this.autoStatus === AUTO_ON) {
                this.toggleAutoScaling();
                this.toggleAutoScaling();
            }
        },
        changeAutoIntervalSlider(event) {
            this.autoIntervalSlider = event.target.value;
            this.autoInterval = [10, 100, 1000][this.autoIntervalSlider];
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

        resetSymCap() {
            this.leftVar = Array(this.rowNum).fill(1);
            this.rightVar = Array(this.columnNum).fill(1);
        },

        valueFormat(value) {
           if (value === 0) {
               return 0;
           } else if (value < 0.01) {
               return value.toExponential(this.resultPrecision - 1);
           } else {
               return value.toPrecision(this.resultPrecision);
           }
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
        rowSum() {
            return this.matrix.map(
                row => {
                    return row.reduce((sum, value) => sum + value, 0);
                }
            )
        },
        columnSum() {
            return this.matrix.reduce(
                (sum, row) => sum.map((x, i) => x + row[i]),
                Array(this.matrix[0].length).fill(0)
            );
        },
        leftCoef() {
            prod = this.inputMatrix.map(
                row => row.reduce(
                    (sum, x, i) => sum + x * this.rightVar[i],
                    0
                )
            );
            lagrangeCoef = Math.pow(prod.reduce((mul, x) => mul * x, 1), 1 / this.inputMatrix.length);
            return this.leftVar.map(
                (x, i) => (lagrangeCoef / prod[i]) / x
            );
        },
        rightCoef() {
            prod = this.inputMatrix.reduce(
                (acc, row, i) => acc.map(
                    (val, j) => val + row[j] * this.leftVar[i]
                ),
                Array(this.inputMatrix[0].length).fill(0)
            );
            lagrangeCoef = Math.pow(prod.reduce((mul, x) => mul * x, 1), 1 / this.inputMatrix[0].length);
            return this.rightVar.map(
                (x, i) => (lagrangeCoef / prod[i]) / x
            );
        }
    },
})

const vm = app.mount('#app')
