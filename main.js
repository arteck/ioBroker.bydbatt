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
const { default: AxiosDigestAuth } = require('@mhoc/axios-digest-auth');


let _batteryNum = 0;
let _arrayNum = 0;
let requestTimeout = null;
let interval = 0;

let PASSWORD = "user";
const USERNAME = "user";

const digestAuth = new AxiosDigestAuth({
   password: PASSWORD,
   username: USERNAME,
});



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

        for (var a = 1; a < _arrayNum+1; a++) {
           let htmlHome = await this.getDatenHome(this.config.ip);
           const resHome  = await this.updateDeviceHome(htmlHome.data);

           for (var b = 1; b < _batteryNum+1; b++) {
                const htmlDataTmp = await this.getDatenGet(this.config.ip, htmlHome.headers);
                const htmlDataSet = await this.getDatenSet(this.config.ip, a, b, htmlHome.headers);
                const htmlData    = await this.getDatenGet(this.config.ip, htmlHome.headers);

                const resData  = await this.updateDevice(htmlData.data, a, b);
            }
        }

        requestTimeout = setTimeout(async () => {
            this.getInfos();
        }, interval);

    }

     async getDatenHome(ip) {
        const statusURLHome = `http://${ip}/asp/Home.asp`;

        const requestOptsAnfr = {
          headers: { Accept: "application/json" },
          method: "GET",
          url: statusURLHome,
        };

        let res = await digestAuth.request(requestOptsAnfr);

//        this.log.debug('datenHome' + JSON.stringify(res.data));
        return res;
    }


    async getDatenGet(ip, head) {
        this.log.debug('getDatenGet GO');

        const statusURLGet = `http://${ip}/asp/RunData.asp`;

        const requestOpts = {
          headers: head,
          method: "GET",
          url: statusURLGet,
        };

        let res = await digestAuth.request(requestOpts);

//        this.log.debug('datenGet ' + res.data);
        return res;
    }


  async getDatenSet(ip, arrNum, battNum, head) {
        this.log.debug('getDatenSet!! GO');

        const statusURLSet = `http://${ip}/goform/SetRunData`;

        const dat = `ArrayNum=${arrNum}&SeriesBatteryNum=${battNum}`;

        head.Referer = 'http://192.168.2.53/asp/RunData.asp';

        const requestOpts = {
          headers: head,
          method: "POST",
          url: statusURLSet,
          data: dat,
        };

         let res = "";
         try {
            res = await digestAuth.request(requestOpts);

        } catch (err) {
           this.log.debug('error request-- ' + JSON.stringify(err.headers));
        }

//        this.log.debug('datenSet-- ' + res.data);
        return res;
    }


    async updateDeviceHome(htmlHome) {
        let htmlText2 = (htmlHome || '').toString().replace(/\r\n|[\r\n]/g, ' ');
            htmlText2 = (htmlText2 || '').toString().replace(/\t|[\t]/g, ' ');

        const g2 = /value=\w*>/g;   // suche status

        var contents = htmlText2.match(g2);
        contents = contents.filter(function(el){
            return el;
        })

        let wert = contents[0];
            wert = wert.replace("value=", "").replace(">", "");

        this.setState('RunStatus', wert, true);

    }
    async updateDevice(htmlData, arrNum, battNum) {
        const arrNumNow = arrNum;
        const battNumNow = battNum;
        let serialNumPosi = "";


        let htmlText2 = (htmlData || '').toString().replace(/\r\n|[\r\n]/g, ' ');
            htmlText2 = (htmlText2 || '').toString().replace(/\t|[\t]/g, ' ');

        const g1 = /<td(>|[^>]+>)((?:.(?!<\/td>))*.?)<\/td>/g;                       // suche alle td
        const g2 = /[a-zA-Z ]+:|[a-zA-Z]+(\[(?:\[??[^\[]*?\])):|value=-?\d*\.?\d*/g;   // suche alle bezeichnungnen und values
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
            let balanceArray = balanceCtrl.split(';">');

            const serialNumValue = contents[contents.indexOf(serialNumPosi)+1].match(g3).toString();

            let treffer = contents.toString();
            var contents = treffer.match(g2);

            contents = contents.filter(function(r1){
                return r1.indexOf(":") > 0 || r1.length > 6;
            })

            const stateArray = await this.getObjectViewAsync('system', 'state', {startkey: this.namespace + '.', endkey: this.namespace +  '.BattNum.1' + '\u9999'})

            if (stateArray && stateArray.rows.length > 0) {
                for (let i = 0; i < stateArray.rows.length; i++) {
                    if (contents.length < 1) {    // wenn nix mehgr zur vergleich dann raus hier
                        break;
                    }

                    if (stateArray.rows[i].id) {
                        let id = stateArray.rows[i].id;
                     
                        this.log.debug("stateArray " + id );

                        id = id.replace("ArrayNum.1", "ArrayNum."+ arrNumNow).replace("BattNum.1", "BattNum." + battNumNow);  // tausche array auf aktuell

                        if (id.indexOf("lastInfoUpdate") > 0) {
                            this.setState(id, Date.now(), true);
                        }

                        var idx = 0;

                        for (; idx < contents.length;) {
                            let idCon = contents[idx];

                            this.log.debug("contents " + idCon );
                         
                            if (idCon.indexOf(" ") > 0) {
                                contents.splice(idx, 1);
                                continue;
                            }

                            if (idCon.indexOf("value=") !== 0) {
                                idCon = idCon.replace(":", "").replace("[", "").replace("]", "");

                                if (id.indexOf(idCon) > 0) {

                                    if (idCon == "BalanceCtrl") {
                                        let idKurz = id.substring(0, id.length - 2);
                                        for (let i = 0; i < 16; i++) {
                                            let wert = false;
                                            if (balanceArray[i].indexOf("true") > 0) {
                                                wert = true;
                                            }
                                            let idIdx = i +1;

                                            this.setState(idKurz + '.' + idIdx, wert, true);
                                            this.log.debug(idKurz + '.' + idIdx, wert);
                                        }
                                        contents.splice(idx, 1);
                                        break;
                                    } else {
                                        let wert = contents[idx + 1];
                                        wert = wert.replace("value=", "");

                                        if (idCon == "SerialNumber") {
                                            wert = serialNumValue;   // serialnummer sonderlocke
                                        }
                                        this.setState(id, wert, true);
                                        this.log.debug(id + ' ' + wert);

                                        wert = contents[idx + 1];
                                        if (wert.indexOf("e=") > 0) {    // suche nach value und wenn gefunden dann lösche die punkte
                                            contents.splice(idx, 2);
                                        }
                                        break;
                                    }
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
        this.extendObjectAsync(`RunStatus`, {
            type: 'state',
            common: {
                name: `RunStatus`,
                type: 'string',
                read: true,
                write: false,
                role: 'info'
            },
            native: {},
        });
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
        this.extendObjectAsync(`ArrayNum.${a}.MinCellVol`, {
            type: 'state',
            common: {
                name: `MinCellVol`,
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
            await this.batteryBalance(a, b+1);
        }
    }

    async batteryBalance(a, b) {
        this.extendObjectAsync(`ArrayNum.${a}.BattNum.${b}.BalanceCtrl`, {
            type: 'channel',
            common: {
                name: `BalanceCtrl`,
            },
            native: {},
        });

        for (var ba = 1; ba < 17; ba++) {
            this.extendObjectAsync(`ArrayNum.${a}.BattNum.${b}.BalanceCtrl.${ba}`, {
                type: 'state',
                common: {
                    name: `${ba}`,
                    type: 'boolean',
                    read: true,
                    write: false,
                    role: 'info'
                },
                native: {},
            });
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


        this.extendObjectAsync(`ArrayNum.${a}.BattNum.${b}.CellVolDiff`, {
            type: 'state',
            common: {
                name: `CellVolDiff`,
                type: 'number',
                read: true,
                write: false,
                def: 0,
                role: 'info',
                unit: 'V'
            },
            native: {},
        });
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
                this.log.error(`initialization undefined no ip`);
                callback();
            }

            if (this.config.arraynum !== undefined ) {
                _arrayNum = Number(this.config.arraynum);
            } else {
                this.log.error(`initialization undefined arraynum undefined`);
                callback();
            }

            if (this.config.batterynum !== undefined ) {
                _batteryNum = Number(this.config.batterynum);
            } else {
                this.log.error(`initialization undefined batterynum undefined`);
                callback();
            }
            interval = parseInt(this.config.interval * 1000, 10);
            if (interval < 60000) {
                interval = 60000;
            }
            if (this.config.batterynum !== undefined ) {
              PASSWORD = this.config.password;         
            } else {
                this.log.error(`initialization undefined password undefined`);
                callback();
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
