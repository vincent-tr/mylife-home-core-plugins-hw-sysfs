'use strict';

const fs        = require('fs');
const log4js    = require('log4js');
const logger    = log4js.getLogger('core-plugins-hw-sysfs.Pwm');
const internals = require('./internals');
const exporter  = new internals.Exporter('dma_pwm', 'pwm-admin');

module.exports = class Pwm {
  constructor(config) {

    this._gpio = parseInt(config.gpio);
    this._activated = exporter.exists();

    this.value = 0;

    if(this._activated) {
      try {
        exporter.export(this._gpio);
        try {
          this._fileName = exporter.attribute('pwm', this._gpio, 'value');
          this.setValue(0);
        } catch(e) {
          exporter.unexport(this._gpio);
          throw e;
        }
      } catch(err) {
        this._activated = false;
        logger.error(`error creating pwm (gpio=${this._gpio} : ${err}`);
      }
    }

    this.online = this._activated ? 'on' : 'off';
  }

  setValue(arg, exiting) {
    if(!exiting) { this.value = arg; }
    this.value = arg;
    if(!this._activated) { return; }
    fs.appendFileSync(this._fileName, arg.toString());
  }

  close(done) {
    if(this._activated) {
      this.setValue(0, true);
      exporter.unexport(this._gpio);
    }
    setImmediate(done);
  }

  static metadata(builder) {
    const binary  = builder.enum('off', 'on');
    const percent = builder.range(0, 100);

    builder.usage.driver();

    builder.attribute('online', binary);
    builder.attribute('value', percent);

    builder.action('setValue', percent);

    builder.config('gpio', 'integer');
  }
};
