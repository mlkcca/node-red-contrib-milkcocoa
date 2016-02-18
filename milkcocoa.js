/**
 * Copyright 2015 Atsushi Kojo.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function (RED) {
  'use strict';
  var MilkCocoa = require('milkcocoa');

  function MilkcocoaNode (n) {
    RED.nodes.createNode(this, n);
  }

  RED.nodes.registerType('milkcocoa', MilkcocoaNode, {
    credentials: {
      appId: { type: 'text' },
      apiKey: { type: 'text' },
      apiSecret: { type: 'password' }
    }
  });

  function MilkcocaInNode (n) {
    RED.nodes.createNode(this, n);
    this.milkcocoa = n.milkcocoa;
    this.dataStore = n.dataStore;
    this.operation = n.operation;
    this.milkcocoaConfig = RED.nodes.getNode(this.milkcocoa);
    if (this.milkcocoaConfig) {
      var node = this;
      var milkcocoa;
      var credentials = RED.nodes.getCredentials(this.milkcocoa);
      if (credentials.apiKey && credentials.apiSecret) {
        milkcocoa = MilkCocoa.connectWithApiKey(credentials.appId + '.mlkcca.com', credentials.apiKey, credentials.apiSecret);
      } else {
        milkcocoa = new MilkCocoa(credentials.appId + '.mlkcca.com');
      }
      var ds = milkcocoa.dataStore(node.dataStore);
      ds.on(node.operation, function (res) {
        var msg = {};
        msg.payload = res;
        node.send(msg);
      });
      this.on('close', function() {
        ds.off(node.operation);
        milkcocoa.disconnect();
      });
    }
  }

  RED.nodes.registerType("milkcocoa in", MilkcocaInNode);

  function MilkcocaOutNode (n) {
    RED.nodes.createNode(this, n);
    this.milkcocoa = n.milkcocoa;
    this.dataStore = n.dataStore;
    this.operation = n.operation;
    this.targetId = n.targetId;
    this.milkcocoaConfig = RED.nodes.getNode(this.milkcocoa);
    if (this.milkcocoaConfig) {
      var node = this;
      var milkcocoa;
      var credentials = RED.nodes.getCredentials(this.milkcocoa);
      if (credentials.apiKey && credentials.apiSecret) {
        milkcocoa = MilkCocoa.connectWithApiKey(credentials.appId + '.mlkcca.com', credentials.apiKey, credentials.apiSecret);
      } else {
        milkcocoa = new MilkCocoa(credentials.appId + '.mlkcca.com');
      }
      this.on('input', function (msg) {
        node.sendMsg = function (err, result) {
          if (err) {
            node.error(err.toString());
            node.status({ fill: 'red', shape: 'ring', text: 'failed' });
          } else {
            node.status({});
          }
          msg.payload = result;
          node.send(msg);
        };
        var targetId = msg.targetId || node.targetId;
        var ds = milkcocoa.dataStore(node.dataStore);
        var payload = typeof msg.payload === 'string' ? JSON.parse(msg.payload) : msg.payload;
        switch (node.operation) {
          case 'push':
            return ds.push(payload, node.sendMsg);
            break;
          case 'send':
            return ds.send(payload, node.sendMsg);
            break;
          case 'set':
            return ds.set(targetId, payload, node.sendMsg);
            break;
          case 'remove':
            return ds.remove(targetId, node.sendMsg);
            break;
        };
      });
      this.on('close', function() {
        milkcocoa.disconnect();
      });
    }
  }

  RED.nodes.registerType("milkcocoa out", MilkcocaOutNode);
}
