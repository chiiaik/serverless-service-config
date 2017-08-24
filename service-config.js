/*
 * @Author: Chii Aik Fang 
 * @Date: 2017-08-07 15:08:20 
 * @Last Modified by: Chii Aik Fang
 * @Last Modified time: 2017-08-24 16:59:20
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
          'functions'
        ]
      },
    };

    this.hooks = {
      'before:deploy:functions': this.beforeDeployFunctions.bind(this)
    };
  }

  beforeDeployFunctions() {
    console.log('beforeDeployFunctions: Creating service config...');
    if (_.isEmpty(this.options.customerId)) {
        throw new Error('customerId command line option is required');
    }
    console.log('options:', JSON.stringify(this.options));
    let service = this.serverless.service.service;
    let region = this.options.region ? this.options.region : this.serverless.service.provider.region;
    let stage = this.options.stage ? this.options.stage : this.serverless.service.provider.stage;
    let customerId = this.options.customerId;
    console.log('region:', region);
    console.log('stage:', stage);
    console.log('customerId', customerId);
    let configPath = path.join(this.serverless.config.servicePath, 'config.json');
    console.log('config file:', configPath);
    let config = {
        stage: stage,
        region: region,
        customerId: customerId,
    };
    fs.writeFile(configPath, JSON.stringify(config), function(error) {
        if (error) {
            console.error('Problem creating service config file at', configPath);
        }
    });
  }
}

module.exports = ServiceConfig;
