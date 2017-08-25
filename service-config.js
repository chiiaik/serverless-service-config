/*
 * @Author: Chii Aik Fang 
 * @Date: 2017-08-07 15:08:20 
 * @Last Modified by: Chii Aik Fang
 * @Last Modified time: 2017-08-25 11:18:37
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
            'resources',
            'functions',
          ],
        },
      };
      this.hooks = {
        'before:deploy:resources': this.beforeDeployResources.bind(this),
        'deploy:resources': this.deployResources.bind(this),
        'after:deploy:resources': this.afterDeployResources.bind(this),
        'before:deploy:functions': this.beforeDeployFunctions.bind(this),
        'deploy:functions': this.deployFucntions.bind(this),
        'after:deploy:functions': this.afterDeployFunctions.bind(this),
      };
  }

  beforeDeployResources() {
    console.log('Before deploying resources');
  }

  deployResources() {
    console.log('Deploying resources');
  }

  afterDeployResources() {
    console.log('After deploying resources');
  }

  beforeDeployFunctions() {
    console.log('Before deploying functions');
    // console.log('options:', this.options);
    // if (_.isEmpty(this.options.config)) {
    //   throw new Error('Please specify the file path to your config file with command line switch --config');
    // }
    // let content = fs.readFileSync(this.options.config, 'utf8');
    // if (_.isEmpty(content)) {
    //   throw new Error('Problem reading config file at ', this.options.config);
    // }
    // let config;
    // try {
    //   config = JSON.parse(content);
    // } catch (e) {
    //   throw new Error('Problem parsing config file due to ' + e);
    // }
    // if (_.isEmpty(config)) {
    //   throw new Error('Please specify customer and accountId in your config');
    // }
    // if (_.isEmpty(config.customer)) {
    //   throw new Error('Please specify customer in your config');
    // }
    // if (!_.isString(config.accountId)) {
    //   throw new Error('Please specify accountId in string format in your config');
    // }
    // if (!_.isEmpty(config.region)) {
    //   throw new Error('Please specify region, for example, us-east-1 in your config');
    // }
    // if (!_.isEmpty(config.stage)) {
    //   throw new Error('Please specify stage, for example, dev in your config');
    // }
    // // let region = this.options.region ? this.options.region : this.serverless.service.provider.region;
    // // let stage = this.options.stage ? this.options.stage : this.serverless.service.provider.stage;
    // // config.region = region;
    // // config.stage = stage;
    // console.log(config);
    // this.serverless.service.custom = config;
    // let configPath = path.join(this.serverless.config.servicePath, 'config.json');
    // console.log('config file:', configPath);
    // fs.writeFile(configPath, JSON.stringify(config), function(error) {
    //     if (error) {
    //         console.error('Problem creating service config file at', configPath);
    //     }
    // });
  }

  deployFucntions() {
    console.log('Deploying functions');
  }

  afterDeployFunctions() {
    console.log('After deploying functions');
  }
}

module.exports = ServiceConfig;
