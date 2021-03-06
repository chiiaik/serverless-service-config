/*
 * @Author: Chii Aik Fang 
 * @Date: 2017-08-07 15:08:20 
 * @Last Modified by: Chii Aik Fang
 * @Last Modified time: 2018-04-25 17:41:58
 */
const fs = require('fs');
const path = require('path');
const mapKeys = require('lodash.mapkeys');
const camelCase = require('lodash.camelcase');
const isEmpty = require('lodash.isempty');
const uuidv4 = require('uuid/v4');

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
      'before:remove:remove': this.beforeRemoveRemove.bind(this),
    };
  }

  beforeDeployResources() {
    // console.log('Before deploying resources');
  }

  deployResources() {
    // console.log('Deploying resources');
  }

  afterDeployResources() {
    // console.log('After deploying resources');
  }

  beforeDeployFunctions() {
    // console.log('Before deploying functions');
    let self = this;
    let tmp = Object.assign({}, self.serverless.service.custom, self.serverless.service.provider.environment);
    let custom = mapKeys(tmp, (value, key) => {
      return camelCase(key);
    });
    // delete custom.accountId;
    delete custom.profile;
    let configPath = path.resolve(self.serverless.config.servicePath, 'src', 'functions', 'config.json');
    fs.writeFile(configPath, JSON.stringify(custom, null, 2), function(error) {
        if (error) {
            console.error('Serverless-Service-Config: Problem creating service config file at', configPath);
        }
    });
  }

  deployFucntions() {
    // console.log('Deploying functions');
  }

  afterDeployFunctions() {
    // console.log('After deploying functions');
  }

  afterDeployDeploy() {
    // console.log('After deploying deploy');
    let self = this;
    let custom = null;
    return self.fetchStackOutput()
      .then((stackOutput) => {
        let tmp = Object.assign({}, self.serverless.service.custom, self.serverless.service.provider.environment, stackOutput);
        custom = mapKeys(tmp, (value, key) => {
          return camelCase(key);
        });
        return custom.apiKeyId;
        // let apiKeyId = `${custom.stage}-${custom.namespace}-${custom.service}-apiKeyId`;
        // console.log('Serverless-Service-Config: apiKeyId=', apiKeyId);
        // return custom[apiKeyId];
      })
      .then((apiKeyId) => {
        return isEmpty(apiKeyId) ? null : self.fetchApiKey(apiKeyId);
      })
      .then((data) => {
        return isEmpty(data) ? null :  self.storeApiKey(custom, data.value);
      })
      .then(() => {
        if (!isEmpty(custom.serviceEndpoint)) {
          return self._storeParameter(self._formatKey(custom, 'endpoint'), custom.serviceEndpoint);
        }
      })
      .then(() => {
        // delete custom.accountId;
        delete custom.profile;
        let configPath = path.resolve(self.serverless.config.servicePath, '__test__', 'config.json');
        fs.writeFile(configPath, JSON.stringify(custom, null, 2), function(error) {
            if (error) {
                console.error('Serverless-Service-Config: Problem creating service config file at', configPath);
            }
        });
      });

      /*
        To resolve db parameters used in lambda, use dbName as the key to store dbPassword in SSM
        Figure out how to set dbHost, dbUser, dbPassword and dbName to env. variable of lambda
      */
  }

  beforeRemoveRemove() {
    // console.log('Before removing stack');
    let self = this;
    return self.fetchStackOutput()
      .then((stackOutput) => {
        let tmp = Object.assign({}, self.serverless.service.custom, self.serverless.service.provider.environment, stackOutput);
        let custom = mapKeys(tmp, (value, key) => {
          return camelCase(key);
        });
        const promises = [];
        promises.push(self.destroyApiKey(custom));
        if (stackOutput.DBInstanceId) {
          promises.push(self.setupRDSDBPassword(stackOutput.DBInstanceId));
        }
        return Promise.all(promises);
      })
      .catch(error => console.error('Serverless-Service-Config: Problem finishing up stack creation in plugin due to', error.message));
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
    );
  }

  storeApiKey(config, apikey) {
    let self = this;
    return self._storeParameter(self._formatKey(config, 'apikey'), apikey);

    // let params = {
    //   Name: apikeyId,
    //   Type: 'SecureString',
    //   Value: apikey,
    //   Overwrite: true,
    // };
    // let provider = this.serverless.getProvider('aws');
    // return provider.request(
    //   'SSM',
    //   'putParameter',
    //   params,
    //   provider.getStage(),
    //   provider.getRegion()
    // )
    // .then((data) => {
    //   return data.Version;
    // });
  }

  destroyApiKey(config) {
    let self = this;
    return self._destroyParameter(self._formatKey(config, 'apikey'))
    .catch((error) => {
      console.warn('FAILED to remove apikey from parameter store due to ', error.message);
    });

    // let params = {
    //   Name: apiKeyId,
    // };
    // let provider = this.serverless.getProvider('aws');
    // return provider.request(
    //   'SSM',
    //   'deleteParameter',
    //   params,
    //   provider.getStage(),
    //   provider.getRegion()
    // );
  }

  setupRDSDBPassword(dbInstaceId) {
    let self = this;
    return self._isDBPasswordAlreadySet(dbInstaceId)
      .then(isSet => {
        if (isSet) {
          return;
        }
        const dbPassword = uuidv4();
        return self._storeParameter(dbInstaceId, dbPassword, true, true)
          .then(() => {
            return self._modifyDBPassword(dbInstaceId, dbPassword);
          });
      })
      .catch(error => console.error('Serverless-Service-Config: Problem setting up RDS DB password for instance', dbInstaceId, 'due to', error.message));
  }

  _formatKey(config, name) {
    return `${config.namespace}-${config.service}-${config.stage}-${name}`
  }

  _isDBPasswordAlreadySet(dbInstaceId) {
    let self = this;
    return self._readParameter(dbInstaceId)
      .then(data => {
        return (data && data.Parameter && data.Parameter.Value);
      });
  }

  _modifyDBPassword(dbInstaceId, dbPassword) {
    let self = this;
    let params = {
      DBInstanceIdentifier: dbInstaceId,
      MasterUserPassword: dbPassword,
    };

    let provider = self.serverless.getProvider('aws');
    return provider.request(
      'RDS',
      'modifyDBInstance',
      params,
      provider.getStage(),
      provider.getRegion(),
    );
  }

  _storeParameter(key, value, isSecure = true, overwrite = true) {
    let params = {
      Name: key,
      Type: isSecure ? 'SecureString' : 'String',
      Value: value,
      Overwrite: overwrite,
    };
    let provider = this.serverless.getProvider('aws');
    return provider.request(
      'SSM',
      'putParameter',
      params,
      provider.getStage(),
      provider.getRegion()
    )
    .then((data) => {
      return data.Version;
    });
  }

  _destroyParameter(key) {
    let params = {
      Name: key,
    };
    let provider = this.serverless.getProvider('aws');
    return provider.request(
      'SSM',
      'deleteParameter',
      params,
      provider.getStage(),
      provider.getRegion()
    );
  }

  _readParameter(key, isSecure = true) {
    let params = {
      Name: key,
      WithDecryption: isSecure,
    };
    let provider = this.serverless.getProvider('aws');
    return provider.request(
      'SSM',
      'getParameter',
      params,
      provider.getStage(),
      provider.getRegion()
    );
  }

  getStackName() {
    return this.serverless.service.getServiceName() + '-' + this.serverless.getProvider('aws').getStage();
  }
}

module.exports = ServiceConfig;
