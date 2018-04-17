/*
 * @Author: Chii Aik Fang 
 * @Date: 2017-08-07 15:08:20 
 * @Last Modified by: Chii Aik Fang
 * @Last Modified time: 2018-04-17 13:51:23
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
        'after:deploy:deploy': this.afterDeployDeploy.bind(this),
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
  }

  deployFucntions() {
    console.log('Deploying functions');
  }

  afterDeployFunctions() {
    console.log('After deploying functions');
  }

  afterDeployDeploy() {
    console.log('After deploying deploy');
    console.log('resources:', this.serverless.service.resources);
    let self = this;
    let custom = null;
    return self.fetchStackOutput()
      .then((stackOutput) => {
        let tmp = Object.assign({}, self.serverless.service.custom, self.serverless.service.provider.environment, stackOutput);
        custom = mapKeys(tmp, (value, key) => {
          return camelCase(key);
        });
        return custom.serviceApiKey;
      })
      .then((apiKeyId) => {
        return self.fetchApiKey(apiKeyId);
      })
      .then((apiKey) => {
        custom = Object.assign(custom, {serviceApiKey: apiKey});
        // console.log('config:', custom);
        let configPath = path.join(self.serverless.config.servicePath, 'config.json');
        // console.log('config file:', configPath);
        fs.writeFile(configPath, JSON.stringify(custom), function(error) {
            if (error) {
                console.error('Problem creating service config file at', configPath);
            }
        });
      });
  }

  fetchStackOutput() {
    let stackName = this.getStackName();
    let provider = this.serverless.getProvider('aws');
    return provider.request(
      'CloudFormation',
      'describeStacks',
      {StackName: stackName},
      provider.getStage(),
      provider.getRegion()
    )
    .then((data) => {
      const stack = data.Stacks.pop() || {Outputs: []};
      const output = stack.Outputs || [];

      return output.reduce(
        (obj, item) => (
          Object.assign(obj, {[item.OutputKey]: item.OutputValue})
        ), {}
      );
    });
  }

  fetchApiKey(apiKeyId) {
    let params = {
      apiKey: apiKeyId,
      includeValue: true,
    };
    let provider = this.serverless.getProvider('aws');
    return provider.request(
      'APIGateway',
      'getApiKey',
      params,
      provider.getStage(),
      provider.getRegion()
    )
    .then((data) => {
      return data.value;
    });
  }

  getStackName() {
    return this.serverless.service.getServiceName() + '-' + this.serverless.getProvider('aws').getStage();
  }
}

module.exports = ServiceConfig;
