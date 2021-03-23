const INITIAL_STATE = 0;
const AFTER_ROW_SCALING = 1;
const AFTER_COLUMN_SCALING = -1;

const AFTER_LEFT = 1;
const AFTER_RIGHT = -1;

const AUTO_OFF = 0;
const AUTO_ON = 1;

const app = Vue.createApp({
    data() {
        return {
            // for input
            inputFile: null,
            inputFileMessage: "",

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
            historyScaling: [[1, 0, 0, 0, 1, 0, 0, 0, 1]],

            scalingStatus: INITIAL_STATE,
            rowScalingNum: 0,
            columnScalingNum: 0,

            autoScalingStatus: AUTO_OFF,
            autoScalingInterval: 100,
            autoScalingIntervalSlider: 1,
            autoScalingId: null,

            // for symmetric capacity
            leftVar: [1, 1, 1],
            rightVar: [1, 1, 1],

            symcapStatus: INITIAL_STATE,
            updateLeftVarNum: 0,
            updateRightVarNum: 0,

            autoSymCapStatus: AUTO_OFF,
            autoSymCapInterval: 100,
            autoSymCapIntervalSlider: 1,
            autoSymCapId: null,

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
        onFileChange(e) {
            this.inputFile = e.target.files[0];
            this.$refs.matrixFile.value = '';
            if (this.inputFile === undefined) {
                return;
            }

            let reader = new FileReader();

            reader.onload = () => {
                let lines = reader.result.split("\n");
                this.inputFileMessage = "";

                let header = lines[0].split(",");
                this.rowNum = parseInt(header[0]);
                if (this.rowNum <= 0) {
                    this.inputFileMessage = "Error: the input matrix should have at least 1 row";
                    this.rowNum = this.inputRowNum = 3;
                    this.columnNum = this.inputColumnNum = 3;
                    this.clearMatrix();
                    return;
                }

                this.columnNum = parseInt(header[1]);
                if (this.columnNum <= 0) {
                    this.inputFileMessage = "Error: the input matrix should have at least 1 column";
                    this.rowNum = this.inputRowNum = 3;
                    this.columnNum = this.inputColumnNum = 3;
                    this.clearMatrix();
                    return;
                }

                this.inputRowNum = this.rowNum;
                this.inputColumnNum = this.columnNum;

                if (lines.length < this.rowNum + 1) {
                    this.inputFileMessage = "Error: the input matrix should have " + this.rowNum + " rows but it does not";
                    this.rowNum = this.inputRowNum = 3;
                    this.columnNum = this.inputColumnNum = 3;
                    this.clearMatrix();
                    return;
                }

                this.inputMatrix = Array(this.rowNum);
                for (let i = 0; i < this.rowNum; ++i) {
                    let values = lines[i + 1].split(",");
                    if (values.length < this.columnNum) {
                        this.inputFileMessage = "Error: the input matrix should have " + this.columnNum + " columns but it does not";
                        this.rowNum = this.inputRowNum = 3;
                        this.columnNum = this.inputColumnNum = 3;
                        this.clearMatrix();
                        return;
                    }
                    this.inputMatrix[i] = Array(this.columnNum);
                    for (let j = 0; j < this.columnNum; ++j) {
                        this.inputMatrix[i][j] = parseInt(values[j]);
                        if (this.inputMatrix[i][j] < 0) {
                            this.inputFileMessage = "Error: the input matrix should not have a negative element but it does";
                            this.rowNum = this.inputRowNum = 3;
                            this.columnNum = this.inputColumnNum = 3;
                            this.clearMatrix();
                            return;
                        }
                    }
                }

                this.resetScaling();
                this.resetSymCap();
            }

            reader.readAsText(this.inputFile);
        },
        // Reset the initial matrix based on the input matrix
        // Called from this.resetScaling()
        resetMatrix() {
            this.matrix = Array(this.rowNum);
            for (let i = 0; i < this.rowNum; i++) {
                this.matrix[i] = [...this.inputMatrix[i]];
            }

            this.historyScaling = [];
            this.pushHistoryScaling();
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

            this.pushHistoryScaling();
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

            this.pushHistoryScaling();
        },
        toggleAutoScaling() {
            if (this.autoScalingStatus === AUTO_OFF) {
                this.autoScalingId = setInterval(() => {
                    if (this.scalingStatus !== AFTER_ROW_SCALING) {
                        this.rowScaling();
                    } else {
                        this.columnScaling();
                    }
                }, this.autoScalingInterval)
                this.autoScalingStatus = AUTO_ON;
            } else {
                clearInterval(this.autoScalingId);
                this.autoScalingId = null;
                this.autoScalingStatus = AUTO_OFF;
            }
        },
        changeAutoScalingInterval(event) {
            this.autoScalingInterval = event.target.value;
            if (this.autoScalingStatus === AUTO_ON) {
                this.toggleAutoScaling();
                this.toggleAutoScaling();
            }
        },
        changeAutoScalingIntervalSlider(event) {
            this.autoScalingIntervalSlider = event.target.value;
            this.autoScalingInterval = [10, 100, 1000][this.autoScalingIntervalSlider];
            if (this.autoScalingStatus === AUTO_ON) {
                this.toggleAutoScaling();
                this.toggleAutoScaling();
            }
        },
        resetScaling() {
            if (this.autoScalingStatus === AUTO_ON) {
                this.toggleAutoScaling();
            }
            this.scalingStatus = INITIAL_STATE;
            this.rowScalingNum = 0;
            this.columnScalingNum = 0;

            this.resetMatrix();
        },
        pushHistoryScaling() {
            let new_history = Array(this.rowNum * this.columnNum);
            for (let i = 0; i < this.rowNum; i++) {
                for (let j = 0; j < this.columnNum; j++) {
                    new_history[i * this.columnNum + j] = this.matrix[i][j];
                }
            }
            this.historyScaling.push(new_history);
        },
        downloadScaling() {
            const blob = new Blob([
                this.historyScaling
                    .map(history => history.join(','))
                    .join('\n')
            ], { "type" : "text/csv" });
            let link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            const date = new Date();
            link.download = 'result_' + `
            ${date.getFullYear()}
            ${(date.getMonth() + 1).toString().padStart(2, '0')}
            ${date.getDate().toString().padStart(2, '0')}
            ${date.getHours().toString().padStart(2, '0')}
            ${date.getMinutes().toString().padStart(2, '0')}
            ${date.getSeconds().toString().padStart(2, '0')}
            `.replace(/\n|\r| /g, '') + '.csv';
            link.click();
        },

        updateLeftVar() {
            if (this.symcapStatus === AFTER_LEFT) {
                return;
            }

            this.leftVar = this.leftVar.map(
                (x, i) => x * this.leftCoef[i]
            );

            this.symcapStatus = AFTER_LEFT;
            this.updateLeftVarNum += 1;
        },
        updateRightVar() {
            if (this.symcapStatus === AFTER_RIGHT) {
                return;
            }

            this.rightVar = this.rightVar.map(
                (x, i) => x * this.rightCoef[i]
            );

            this.symcapStatus = AFTER_RIGHT;
            this.updateRightVarNum += 1;
        },
        toggleAutoSymCap() {
            if (this.autoSymCapStatus === AUTO_OFF) {
                this.autoSymCapId = setInterval(() => {
                    if (this.symcapStatus !== AFTER_LEFT) {
                        this.updateLeftVar();
                    } else {
                        this.updateRightVar();
                    }
                }, this.autoSymCapInterval)
                this.autoSymCapStatus = AUTO_ON;
            } else {
                clearInterval(this.autoSymCapId);
                this.autoSymCapId = null;
                this.autoSymCapStatus = AUTO_OFF;
            }
        },
        changeAutoSymCapInterval(event) {
            this.autoSymCapInterval = event.target.value;
            if (this.autoSymCapStatus === AUTO_ON) {
                this.toggleAutoSymCap();
                this.toggleAutoSymCap();
            }
        },
        changeAutoSymCapIntervalSlider(event) {
            this.autoSymCapIntervalSlider = event.target.value;
            this.autoSymCapInterval = [10, 100, 1000][this.autoSymCapIntervalSlider];
            if (this.autoSymCapStatus === AUTO_ON) {
                this.toggleAutoSymCap();
                this.toggleAutoSymCap();
            }
        },
        resetSymCap() {
            this.symcapStatus = INITIAL_STATE;
            this.updateLeftVarNum = 0;
            this.updateRightVarNum = 0;

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
        INITIAL_STATE() { return 0 },
        AFTER_ROW_SCALING() { return 1 },
        AFTER_COLUMN_SCALING() { return -1 },

        AFTER_LEFT() { return 1 },
        AFTER_RIGHT() { return -1 },

        AUTO_OFF() { return 0 },
        AUTO_ON() { return 1 },

        canRowScale() {
            return this.autoScalingStatus === AUTO_OFF
                && this.scalingStatus !== AFTER_ROW_SCALING;
        },
        canColumnScale() {
            return this.autoScalingStatus === AUTO_OFF
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

        upgradableLeft() {
            return this.autoSymCapStatus === AUTO_OFF
                && this.symcapStatus !== AFTER_LEFT;
        },
        upgradableRight() {
            return this.autoSymCapStatus === AUTO_OFF
                && this.symcapStatus !== AFTER_RIGHT;
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
