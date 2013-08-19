/**
 * Copyright 2013 DreamFactory Software, Inc. <support@dreamfactory.com>
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
 */
/**
 * Initialize namespace
 */
;
var DreamFactory = DreamFactory || {};
DreamFactory.Platform = DreamFactory.Platform || {};

(function($) {
  /**
   * @param options
   * @constructor
   */
  DreamFactory.Platform.SDK = function DreamFactory_Platform_SDK(options) {
    this.options = $.extend({}, this.defaults, options);
    return this;
  };

  /**
   * SDK
   * @type {{defaults: {dspTarget: string, appKey: string, sessionId: null}, DreamFactory_Platform_SDK_init: Function, login: Function, getProfile: Function, _apiCall: Function, _setToken: Function}}
   */
  DreamFactory.Platform.SDK.prototype = {

    defaults: {
      dspTarget: 'http://localhost',
      appKey:    'launchpad',
      sessionId: null
    },

    /**
     * Constructor
     * @param options
     * @constructor
     */
    DreamFactory_Platform_SDK_init: function(options) {
    },

    /**
     * Login and get a session ID
     * @param email
     * @param password
     * @param onSuccess
     * @param onError
     */
    login: function(email, password, onSuccess, onError) {
      var _self = this;

      return this._apiCall(
        {
          method:  'POST',
          path:    '/user/session',
          params:  {
            email:    email,
            password: password
          },
          success: function(response) {
            _self._setToken(response);
            if (typeof onSuccess === 'function')
              onSuccess(response);
          },
          error:   onError
        }
      );
    },

    /**
     * Retrieve the current user's profile information
     */
    getProfile: function() {
      return this._apiCall('/user/profile');
    },

    /**
     * Make an API request
     * @param config
     */
    _apiCall: function(config) {
      var _self = this;

      if (typeof config !== 'object') {
        config = {
          method: 'GET',
          path:   config
        }
      }

      $.ajax(
        {
          url:         this.options.dspTarget + '/rest' + config.path,
          method:      config.method || 'GET',
          data:        typeof config.params === 'object' ? JSON.stringify(config.params) : config.params,
          crossDomain: true,

          /**
           * Set headers
           * @param xhr
           */
          beforeSend: function(xhr) {
            xhr.setRequestHeader('X-DreamFactory-Session-Token', _self.options.sessionId);
            xhr.setRequestHeader('X-DreamFactory-Application-Name', _self.options.appKey);
          },

          /**
           * Success handler
           * @param response
           */
          success: function(response) {
            if ($.isFunction(config.success)) {
              config.success(response);
            }
          },

          /**
           * Error handler
           * @param response
           */
          error: function(response) {
            if ($.isFunction(config.error)) {
              config.error(response);
            }
          },

          /**
           * Success handler
           * @param response
           */
          complete: function(response) {
            if ($.isFunction(config.complete)) {
              config.complete(response);
            }
          }
        });
    },

    /**
     * Sets the session token
     * @param response
     */
    _setToken: function(response) {
      if (response && response.session_id)
        this.options.sessionId = response.session_id;
    }
  };
})(jQuery);