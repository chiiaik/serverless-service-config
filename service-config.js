/*
 * @Author: Chii Aik Fang 
 * @Date: 2017-08-07 15:08:20 
 * @Last Modified by: Chii Aik Fang
 * @Last Modified time: 2017-08-25 10:42:49
 */
const _ = require('lodash');
const fs = require('fs');
const path = require('path');

class ServiceConfig {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.commands = {
        deploy: {
          lifecycleEvents: [
            'functions',
          ],
        },
      };
      this.hooks = {
        'before:deploy:functions': this.beforeDeployFunctions.bind(this),
      };
  }

  beforeDeployFunctions() {
    console.log('beforeDeployFunctions: Reading service config...');
    console.log('options:', this.options);
    if (_.isEmpty(this.options.config)) {
      throw new Error('Please specify the file path to your config file with command line switch --config');
    }
    let config;
    fs.readFileSync(this.options.config, function(err, data) {
      if (err) {
        throw new Error('Problem reading config file at ' + this.options.config);
      }
      try {
        config = JSON.parse(data);
      } catch (e) {
        throw new Error('Problem parsing config file due to ' + e);
      }
    });
    if (_.isEmpty(config)) {
      throw new Error('Please specify customer and accountId in your config');
    }
    if (_.isEmpty(config.customer)) {
      throw new Error('Please specify customer in your config');
    }
    if (_.isEmpty(config.accountId)) {
      throw new Error('Please specify accountId in your config');
    }
    let region = this.options.region ? this.options.region : this.serverless.service.provider.region;
    let stage = this.options.stage ? this.options.stage : this.serverless.service.provider.stage;
    config.region = region;
    config.stage = stage;
    console.log(config);
    this.serverless.service.custom = config;
    let configPath = path.join(this.serverless.config.servicePath, 'config.json');
    console.log('config file:', configPath);
    fs.writeFile(configPath, JSON.stringify(config), function(error) {
        if (error) {
            console.error('Problem creating service config file at', configPath);
        }
    });

    throw new Error('dry run');
  }
}

module.exports = ServiceConfig;
