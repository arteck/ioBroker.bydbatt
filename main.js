/**
 *
 *      ioBroker bydbatt Adapter
 *
 *      (c) 2014-2020 arteck <arteck@outlook.com>
 *
 *      MIT License
 *
 */

'use strict';
 
const utils = require('@iobroker/adapter-core');
const axios = require('axios');

let _batteryNum = 0;
let _arrayNum = 0;
let requestTimeout = null;
let interval = 0;


const htmlData_test = "<html>\r\n<head>\r\n<title>RunData</title>\r\n<meta http-equiv=Content-Type content=text/html; charset=utf-8 />\r\n<meta http-equiv=\"Pragma\" content=\"no-cache\">\r\n<link href=\"../default.css\" rel=\"stylesheet\" type=\"text/css\">\r\n<script language=\"javascript\">\r\nfunction submitForm(){ \r\n\tvar form = document.getElementById(\"RunData\");\r\n\tform.submit();\r\n}\r\n</script>\r\n</head>\r\n<body>\r\n<center>\r\n<br>\r\n<h3>Run Data</h3>\r\n</center>\r\n<hr>\r\n<center>\r\n<br>\r\n<form method=\"post\" name=\"RunData\" id=\"RunData\" action=\"/goform/SetRunData\">\r\n<table border=\"0\" cellspacing=\"0\" cellpadding=\"0\" class=\"common_table\">\r\n<tr>\r\n<td colspan=\"2\" width=\"20%\"><h3>Array Num:</h3></td>\n<td width=\"60%\"><select name=\"ArrayNum\" onChange=\"submitForm();\">\n<option value=\"1\" id=\"1\" selected=\"selected\">1</option>\n</select></td></tr>\n<tr>\n<td width=\"5%\"></td>\n<td width=\"15%\">ArrayVoltage:</td>\n<td width=\"60%\"><input readonly=\"readonly\" type=\"text\" value=424.282>&nbsp;&nbsp;V</td>\n</tr>\n<tr>\n<td></td>\n<td>PackVoltage:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=424.260>&nbsp;&nbsp;V</td>\n</tr>\n<tr>\n<td></td>\n<td>Current:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=5.398>&nbsp;&nbsp;A</td>\n</tr>\n<tr>\n<td></td>\n<td>SOC:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=24.200%></td>\n</tr>\n<tr>\n<td></td>\n<tr>\n<td></td>\n<td>SysTemp:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=24.700>&nbsp;&nbsp;&#8451</td>\n</tr>\n<tr>\n<td></td>\n<td>MaxCellVol:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=3.319>&nbsp;&nbsp;V</td>\n</tr>\n<tr>\n<td></td>\n<td>MinCellVol:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=3.311>&nbsp;&nbsp;V</td>\n</tr>\n<tr>\n<td></td>\n<td>MaxCellTemp:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=22.300>&nbsp;&nbsp;&#8451</td>\n</tr>\n<tr>\n<td></td>\n<td>MinCellTemp:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=19.600>&nbsp;&nbsp;&#8451</td>\n</tr>\n<tr>\n<td></td>\n<td>MaxVolPos:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=8></td>\n</tr>\n<tr>\n<td></td>\n<td>MinVolPos:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=4></td>\n</tr>\n<tr>\n<td></td>\n<td>MaxTempPos:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=4></td>\n</tr>\n<tr>\n<td></td>\n<td>MinTempPos:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=1></td>\n</tr>\n<tr>\n<td></td>\n<td>Power:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=2.248>&nbsp;&nbsp;KW</td>\n</tr>\n</table><br>\n<table border=\"0\" cellspacing=\"0\" cellpadding=\"0\" class=\"common_table\">\n<tr>\n<td colspan=\"2\" width=\"40%\"><h3>Series Battery Num:</h3></td>\n<td width=\"40%\"><select name=\"SeriesBatteryNum\" onChange=\"submitForm();\">\n<option value=\"1\" id=\"1\" selected=\"selected\">1</option>\n<option value=\"2\" id=\"2\">2</option>\n<option value=\"3\" id=\"3\">3</option>\n<option value=\"4\" id=\"4\">4</option>\n<option value=\"5\" id=\"5\">5</option>\n<option value=\"6\" id=\"6\">6</option>\n<option value=\"7\" id=\"7\">7</option>\n<option value=\"8\" id=\"8\">8</option>\n</select></td>\n</tr><tr>\n<td width=\"5%\"></td>\n<td width=\"15%\">SerialNumber:</td>\n<td width=\"60%\"><input readonly=\"readonly\" type=\"text\" value=1C351909-00616 2019/08/29 14:23:00:2>&nbsp;&nbsp;</td>\n</tr><tr>\n<td width=\"5%\"></td>\n<td width=\"15%\">BattVol:</td>\n<td width=\"60%\"><input readonly=\"readonly\" type=\"text\" value=53.065>&nbsp;&nbsp;V</td>\n</tr>\n<tr>\n<td></td>\n<td>CellVolDiff:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=0.004>&nbsp;&nbsp;V</td>\n</tr>\n<tr>\n<td></td>\n<td>CellVol[1]:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=3.317>&nbsp;&nbsp;V</td>\n</tr>\n<tr>\n<td></td>\n<td>CellVol[2]:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=3.317>&nbsp;&nbsp;V</td>\n</tr>\n<tr>\n<td></td>\n<td>CellVol[3]:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=3.317>&nbsp;&nbsp;V</td>\n</tr>\n<tr>\n<td></td>\n<td>CellVol[4]:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=3.317>&nbsp;&nbsp;V</td>\n</tr>\n<tr>\n<td></td>\n<td>CellVol[5]:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=3.316>&nbsp;&nbsp;V</td>\n</tr>\n<tr>\n<td></td>\n<td>CellVol[6]:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=3.317>&nbsp;&nbsp;V</td>\n</tr>\n<tr>\n<td></td>\n<td>CellVol[7]:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=3.316>&nbsp;&nbsp;V</td>\n</tr>\n<tr>\n<td></td>\n<td>CellVol[8]:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=3.317>&nbsp;&nbsp;V</td>\n</tr>\n<tr>\n<td></td>\n<td>CellVol[9]:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=3.318>&nbsp;&nbsp;V</td>\n</tr>\n<tr>\n<td></td>\n<td>CellVol[10]:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=3.314>&nbsp;&nbsp;V</td>\n</tr>\n<tr>\n<td></td>\n<td>CellVol[11]:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=3.316>&nbsp;&nbsp;V</td>\n</tr>\n<tr>\n<td></td>\n<td>CellVol[12]:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=3.317>&nbsp;&nbsp;V</td>\n</tr>\n<tr>\n<td></td>\n<td>CellVol[13]:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=3.316>&nbsp;&nbsp;V</td>\n</tr>\n<tr>\n<td></td>\n<td>CellVol[14]:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=3.316>&nbsp;&nbsp;V</td>\n</tr>\n<tr>\n<td></td>\n<td>CellVol[15]:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=3.317>&nbsp;&nbsp;V</td>\n</tr>\n<tr>\n<td></td>\n<td>CellVol[16]:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=3.317>&nbsp;&nbsp;V</td>\n</tr>\n<tr>\n<td></td>\n<td>CellVolMax:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=3.318>&nbsp;&nbsp;V</td>\n</tr>\n<tr>\n<td></td>\n<td>CellVolMin:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=3.314>&nbsp;&nbsp;V</td>\n</tr>\n<tr>\n<td></td>\n<td>CellTemp[1]:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=20.000>&nbsp;&nbsp;&#8451</td>\n</tr>\n<tr>\n<td></td>\n<td>CellTemp[2]:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=19.800>&nbsp;&nbsp;&#8451</td>\n</tr>\n<tr>\n<td></td>\n<td>CellTemp[3]:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=19.700>&nbsp;&nbsp;&#8451</td>\n</tr>\n<tr>\n<td></td>\n<td>CellTemp[4]:</td>\n<td><input readonly=\"readonly\" type=\"text\" value=19.600>&nbsp;&nbsp;&#8451</td>\n</tr>\n<tr>\n<td></td>\n<td>BalanceCtrl:</td>\n<td>1:<input type=\"checkbox\" onclick=\"return false;\">2:<input type=\"checkbox\" onclick=\"return false;\">3:<input type=\"checkbox\" onclick=\"return false;\">4:<input type=\"checkbox\" onclick=\"return false;\">5:<input type=\"checkbox\" onclick=\"return false;\">6:<input type=\"checkbox\" onclick=\"return false;\">7:<input type=\"checkbox\" onclick=\"return false;\">8:<input type=\"checkbox\" onclick=\"return false;\">9:<input type=\"checkbox\" onclick=\"return false;\">10:<input type=\"checkbox\" onclick=\"return false;\">11:<input type=\"checkbox\" onclick=\"return false;\">12:<input type=\"checkbox\" onclick=\"return false;\">13:<input type=\"checkbox\" onclick=\"return false;\">14:<input type=\"checkbox\" onclick=\"return false;\">15:<input type=\"checkbox\" onclick=\"return false;\">16:<input type=\"checkbox\" onclick=\"return false;\">\r\n</td>\r\n</tr>\r\n</table>\r\n</form>\r\n</center>\r\n</body>\r\n</html>\r\n";

class bydbattControll extends utils.Adapter {

    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: 'bydbatt',
        });
        this.on('ready', this.onReady.bind(this));
        this.on('unload', this.onUnload.bind(this));

    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        this.setState('info.connection', false, true);

        await this.initialization();
        await this.create_state();
        await this.getInfos();
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            if (requestTimeout) clearTimeout(requestTimeout);

            this.log.info('cleaned everything up...');
            this.setState('info.connection', false, true);
            callback();
        } catch (e) {
            callback();
        }
    }


    async getInfos() {
        this.log.debug(`get Information`);
   
        if (requestTimeout) clearTimeout(requestTimeout);

        for (var a = 0; a < _arrayNum; a++) {
            for (var b = 0; b < _batteryNum; b++) {

            //    const htmlData = await this.getDaten(this.config.ip, a, b);
                const res = await this.updateDevice(htmlData_test, a, b);


            }
        }

        requestTimeout = setTimeout(async () => {
            this.getInfos();
        }, interval);
        
    }


    async getDaten(ip, arrNum, battNum) {
        const statusURL = `http://user:user@${ip}/asp/RunData.asp`;
        const res = await axios.get(statusURL);
        const htmlData = res.data;
        return htmlData;
    }

    async updateDevice(htmlData, arrNum, battNum) {
        const arrNumNow = arrNum +1;
        const battNumNow = battNum +1;
        let serialNumPosi = "";


        let htmlText2 = (htmlData || '').toString().replace(/\r\n|[\r\n]/g, ' ');
            htmlText2 = (htmlText2 || '').toString().replace(/\t|[\t]/g, ' ');

        const g1 = /<td(>|[^>]+>)((?:.(?!<\/td>))*.?)<\/td>/g;                       // suche alle td
        const g2 = /[a-zA-Z ]+:|[a-zA-Z]+(\[(?:\[??[^\[]*?\])):|value=\d*\.?\d*/g;   // suche alle bezeichnungnen und values
        const g3 = /\w*\d*-\w*\d*/g; // suche serialnummer

        try {

            var contents = htmlText2.match(g1);
            contents = contents.filter(function(el){
                if (el.indexOf("SerialNumber") > 1) {
                    serialNumPosi = el;
                }
                return el.indexOf(":") || el.indexOf("value");
            })

            const balanceCtrl = contents[contents.length-1];
            const serialNumValue = contents[contents.indexOf(serialNumPosi)+1].match(g3).toString();

            let treffer = contents.toString();
            var contents = treffer.match(g2);

            contents = contents.filter(function(r1){
                return r1.indexOf(":") > 0 || r1.length > 6;
            })

            const stateArray = await this.getObjectViewAsync('system', 'state', {startkey: this.namespace + '.', endkey: this.namespace +  '.BattNum.1' + '\u9999'})

            if (stateArray && stateArray.rows.length > 0) {
                for (let i = 0; i < stateArray.rows.length; i++) {
                    if (stateArray.rows[i].id) {
                        let id = stateArray.rows[i].id;

                        id = id.replace("ArrayNum.1", "ArrayNum."+ arrNumNow).replace("BattNum.1", "BattNum." + battNumNow);  // tausche array auf aktuell


                        if (id.indexOf("lastInfoUpdate") > 0) {
                            this.setState(obje._id, Date.now(), true);
                        }

                        var idx = 0;

                        for (; idx < contents.length+1;) {
                            let idCon = contents[idx];

                            if (idCon.indexOf(" ") > 0) {
                                contents.shift();
                                continue;
                            }

                            if (idCon.indexOf("value=") !== 0) {
                                idCon = idCon.replace(":", "").replace("[", "").replace("]", "");

                                if (id.indexOf(idCon) > 0) {
                                    let wert = contents[idx + 1];
                                    if (idCon == "SerialNumber") {
                                        wert = serialNumValue;   // serialnummer sonderlocke
                                    } else {
                                        wert = wert.replace("value=", "");
                                    }
                                    this.setState(id, wert, true);
                                    contents.shift();
                                    contents.shift();
                                    break;
                                }
                            }
                            idx++;
                        }
                    }
                }
            }
        } catch (err) {
            this.log.debug(`update problem`);
        }
    }


    async create_state() {
        this.log.debug(`create state`);

        try {
            for (var i = 0; i < _arrayNum; i++) {
                const res = await this.creArrayNum(i + 1);

            }
            this.setState('info.connection', true, true);
        } catch (err) {
            this.log.debug(`create state problem`);
        }
    }

    async creArrayNum(a) {
        this.extendObjectAsync(`ArrayNum.${a}`, {
            type: 'channel',
            common: {
                name: `ArrayNum`,
            },
            native: {},
        });

        this.extendObjectAsync(`ArrayNum.${a}.ArrayVoltage`, {
            type: 'state',
            common: {
                name: `ArrayVoltage`,
                type: 'number',
                read: true,
                write: false,
                def: 0,
                role: 'info',
                unit: 'V'
            },
            native: {},
        });

        this.extendObjectAsync(`ArrayNum.${a}.PackVoltage`, {
            type: 'state',
            common: {
                name: `PackVoltage`,
                type: 'number',
                read: true,
                write: false,
                def: 0,
                role: 'info',
                unit: 'V'
            },
            native: {},
        });

        this.extendObjectAsync(`ArrayNum.${a}.Current`, {
            type: 'state',
            common: {
                name: `Current`,
                type: 'number',
                read: true,
                write: false,
                def: 0,
                role: 'info',
                unit: 'A'
            },
            native: {},
        });

        this.extendObjectAsync(`ArrayNum.${a}.SOC`, {
            type: 'state',
            common: {
                name: `SOC`,
                type: 'number',
                read: true,
                write: false,
                def: 0,
                role: 'battery.percent',
                unit: '%'
            },
            native: {},
        });
        this.extendObjectAsync(`ArrayNum.${a}.SysTemp`, {
            type: 'state',
            common: {
                name: `SysTemp`,
                type: 'number',
                read: true,
                write: false,
                def: 0,
                role: 'value.temperature',
                unit: '°C'
            },
            native: {},
        });

        this.extendObjectAsync(`ArrayNum.${a}.MaxCellVol`, {
            type: 'state',
            common: {
                name: `MaxCellVol`,
                type: 'number',
                read: true,
                write: false,
                def: 0,
                role: 'info',
                unit: 'V'
            },
            native: {},
        });
        this.extendObjectAsync(`ArrayNum.${a}.MaxCellTemp`, {
            type: 'state',
            common: {
                name: `MaxCellTemp`,
                type: 'number',
                read: true,
                write: false,
                def: 0,
                role: 'value.temperature',
                unit: '°C'
            },
            native: {},
        });
        this.extendObjectAsync(`ArrayNum.${a}.MinCellTemp`, {
            type: 'state',
            common: {
                name: `MinCellTemp`,
                type: 'number',
                read: true,
                write: false,
                def: 0,
                role: 'value.temperature',
                unit: '°C'
            },
            native: {},
        });
        this.extendObjectAsync(`ArrayNum.${a}.MaxVolPos`, {
            type: 'state',
            common: {
                name: `MaxVolPos`,
                type: 'number',
                read: true,
                write: false,
                def: 0,
                role: 'info'
            },
            native: {},
        });
        this.extendObjectAsync(`ArrayNum.${a}.MinVolPos`, {
            type: 'state',
            common: {
                name: `MinVolPos`,
                type: 'number',
                read: true,
                write: false,
                def: 0,
                role: 'info'
            },
            native: {},
        });
        this.extendObjectAsync(`ArrayNum.${a}.MaxTempPos`, {
            type: 'state',
            common: {
                name: `MaxTempPos`,
                type: 'number',
                read: true,
                write: false,
                def: 0,
                role: 'info'
            },
            native: {},
        });
        this.extendObjectAsync(`ArrayNum.${a}.MinTempPos`, {
            type: 'state',
            common: {
                name: `MinTempPos`,
                type: 'number',
                read: true,
                write: false,
                def: 0,
                role: 'info'
            },
            native: {},
        });
        this.extendObjectAsync(`ArrayNum.${a}.Power`, {
            type: 'state',
            common: {
                name: `Power`,
                type: 'number',
                read: true,
                write: false,
                def: 0,
                role: 'info',
                unit: 'KW'
            },
            native: {},
        });

        for (var b = 0; b < _batteryNum; b++) {
            await this.batteryNum(a, b+1);

        }


    }
    async batteryNum(a, b) {
        this.extendObjectAsync(`ArrayNum.${a}.BattNum`, {
            type: 'channel',
            common: {
                name: `BattNum`,
            },
            native: {},
        });
        this.extendObjectAsync(`ArrayNum.${a}.BattNum.${b}`, {
            type: 'channel',
            common: {
                name: `BattNum`,
            },
            native: {},
        });

        this.extendObjectAsync(`ArrayNum.${a}.BattNum.${b}.SerialNumber`, {
            type: 'state',
            common: {
                name: `SerialNumber`,
                type: 'string',
                read: true,
                write: false,
                role: 'info'
            },
            native: {},
        });
        this.extendObjectAsync(`ArrayNum.${a}.BattNum.${b}.BattVol`, {
            type: 'state',
            common: {
                name: `BattVol`,
                type: 'number',
                read: true,
                write: false,
                def: 0,
                role: 'info',
                unit: 'V'
            },
            native: {},
        });

        for (var cell = 1; cell < 17; cell++) {
            this.extendObjectAsync(`ArrayNum.${a}.BattNum.${b}.CellVol${cell}`, {
                type: 'state',
                common: {
                    name: `CellVol${cell}`,
                    type: 'number',
                    read: true,
                    write: false,
                    def: 0,
                    role: 'info',
                    unit: 'V'
                },
                native: {},
            });
        }
        this.extendObjectAsync(`ArrayNum.${a}.BattNum.${b}.CellVolMax`, {
            type: 'state',
            common: {
                name: `CellVolMax`,
                type: 'number',
                read: true,
                write: false,
                def: 0,
                role: 'info',
                unit: 'V'
            },
            native: {},
        });
        this.extendObjectAsync(`ArrayNum.${a}.BattNum.${b}.CellVolMin`, {
            type: 'state',
            common: {
                name: `CellVolMin`,
                type: 'number',
                read: true,
                write: false,
                def: 0,
                role: 'info',
                unit: 'V'
            },
            native: {},
        });

        for (var cell = 1; cell < 5; cell++) {
            this.extendObjectAsync(`ArrayNum.${a}.BattNum.${b}.CellTemp${cell}`, {
                type: 'state',
                common: {
                    name: `CellTemp${cell}`,
                    type: 'number',
                    read: true,
                    write: false,
                    def: 0,
                    role: 'value.temperature',
                    unit: '°C'
                },
                native: {},
            });
        }
        this.extendObjectAsync(`ArrayNum.${a}.BattNum.${b}.lastInfoUpdate`, {
            type: 'state',
            common: {
                name: 'Date/Time of last information update',
                type: 'number',
                role: 'value.time',
                read: true,
                write: false
            },
            native: { },
        });

    }
    async initialization() {
        try {
            if (this.config.ip === undefined ) {
                this.log.debug(`initialization undefined no ip`);
                callback();
            }

            if (this.config.arraynum !== undefined ) {
                _arrayNum = Number(this.config.arraynum);
            } else {
                this.log.debug(`initialization undefined arraynum undefined`);
                callback();
            }

            if (this.config.batterynum !== undefined ) {
                _batteryNum = Number(this.config.batterynum);
            } else {
                this.log.debug(`initialization undefined batterynum undefined`);
                callback();
            }
            interval = parseInt(this.config.interval * 1000, 10);
            if (interval < 60000) {
                interval = 60000;
            }

        } catch (error) {
            this.log.error('other problem');
        }
    }

}
// @ts-ignore parent is a valid property on module
if (module.parent) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new bydbattControll(options);
} else {
    // otherwise start the instance directly
    new bydbattControll();
}
