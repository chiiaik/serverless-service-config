/*
 * @Author: Chii Aik Fang 
 * @Date: 2017-08-07 15:08:20 
 * @Last Modified by: Chii Aik Fang
 * @Last Modified time: 2018-04-11 15:19:22
 */
const fs = require('fs');
const path = require('path');
const mapKeys = require('lodash.mapkeys');
const camelCase = require('lodash.camelcase');

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
    let tmp = Object.assign({}, this.serverless.service.custom, this.serverless.service.provider.environment);
    let custom = mapKeys(tmp, (value, key) => {
      return camelCase(key);
    });
    console.log('config:', custom);
    let configPath = path.join(this.serverless.config.servicePath, 'config.json');
    console.log('config file:', configPath);
    fs.writeFile(configPath, JSON.stringify(custom), function(error) {
        if (error) {
            console.error('Problem creating service config file at', configPath);
        }
    });
  }

  deployFucntions() {
    console.log('Deploying functions');
  }

  afterDeployFunctions() {
    console.log('After deploying functions');
  }
}

module.exports = ServiceConfig;
