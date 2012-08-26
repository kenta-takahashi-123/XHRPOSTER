(function () {
  require([
    "dijit/Dialog",
    "dijit/form/Form",
    "dijit/form/Button",
    "dijit/form/TextBox",
    "dijit/form/CheckBox",
    "dijit/form/ValidationTextBox",
    "dijit/form/SimpleTextarea",
    "dijit/form/NumberSpinner",
    "dijit/form/ComboBox"
  ]);

  require([
    "dojo/parser",
    "dojo/store/Memory",
    "dijit/TitlePane",
    "dijit/Tooltip",
    "dijit/layout/TabContainer",
    "dijit/layout/BorderContainer",
    "dijit/layout/ContentPane"
  ], function (parser, memoryStore, titlePane, tooltip, tab, border, pane) {
    dojo.ready(function () {
      parser.parse(dojo.body());

      /**
       * counter of request tab
       * @type {Number}
       */
      var count = 1;

      /**
       * Response tab container.
       * @type {dijit.layout.TabContainer}
       */
      var tabContainer = dijit.byId("tab_response");

      /**
       * Form for common parameters
       * @type {dijit.form.Form}
       */
      var formCommon = dijit.byId("formCommon");

      /**
       * Form for HTTP headers
       * @type {dijit.form.Form}
       */
      var formHeaders = dijit.byId("formHeaders");

      /**
       * @type {dijit.form.SimpleTextarea}
       */
      var formOtherHeaders = dijit.byId('otherHeaders');

      /**
       * Form for HTTP headers
       * @type {dijit.form.Form}
       */
      var formBody = dijit.byId("formBody");

      /**
       * method for sending XHR
       * @param {String} method
       */
      var send = function (/* string */ method) {
        var tab = createTab();
        var loadingPane = new pane({
          region:"center",
          content:dojo.create('div', {innerHTML:'Loading...'})
        });
        tab.addChild(loadingPane);

        var requestObject = generateRequestObject();

        var callback = function (response, ioArgs) {
          var containers = createResponsePane(method, response, ioArgs, generateRequestObject());
          tab.removeChild(loadingPane);
          tab.addChild(containers.center);
          tab.addChild(containers.bottom);
        };
        requestObject.load = callback;
        requestObject.error = callback;

        dojo.xhr(method, requestObject);
      };

      var createTab = function () {
        //Tab Pane
        var container = new border({
          closable:true,
          title:"#" + count,
          gutters:false,
          liveSplitters:true
        });
        count++;
        tabContainer.addChild(container);
        tabContainer.selectChild(container);
        container.startup();
        return container;
      };

      var createResponsePane = function (method, response, ioArgs, formData) {
        //Method, Status, Bottom
        var containerCenter = new border({
          region:"center",
          gutters:false
        });

        var containerBottom = new dijit.layout.BorderContainer({
          region:"bottom",
          gutters:false,
          splitter:true,
          closable:true,
          style:(formData.openHeader[0] || formData.openRequest[0]) ? "height:150px;" : "height:80px;"
        });

        //Method, Status
        var containerCenterTop = new dijit.layout.ContentPane({region:"top"});
        containerCenter.addChild(containerCenterTop);

        //Body
        var containerCenterCenter = new dijit.layout.TabContainer({
          region:"center",
          tabPosition:"bottom",
          style:"margin: 5px;"
        });
        containerCenter.addChild(containerCenterCenter);

        //Header, Request
        var containerBottomCenter = new dijit.layout.ContentPane({region:"center"});
        containerBottom.addChild(containerBottomCenter);

        if (!ioArgs.args.url) {
          ioArgs.args.url = '(blank)';
        }
        var title = dojo.create("div", {innerHTML:escapeHTML(method + " on " + ioArgs.args.url)});
        dojo.place(title, containerCenterTop.domNode);
        var status = dojo.create("div", {innerHTML:escapeHTML("Status: " + ioArgs.xhr.status + " " + ioArgs.xhr.statusText)});
        dojo.place(status, containerCenterTop.domNode);

        var bodyRaw = new dijit.layout.ContentPane({title:"Raw data"});
        var bodyRawText = new dijit.form.SimpleTextarea({
          value:ioArgs.xhr.responseText,
          style:"width:97%;height:97%;"
        });
        dojo.place(bodyRawText.domNode, bodyRaw.domNode);
        containerCenterCenter.addChild(bodyRaw);

        //If response text can be parsed to JSON, add Pretty print tab.
        try {
          var bodyPretty = new dijit.layout.ContentPane({title:"JSON Pretty print"});
          var bodyPrettyText = new dijit.form.SimpleTextarea({
            value:dojo.toJson(dojo.fromJson(ioArgs.xhr.responseText), true), //Pretty print
            style:"width:97%;height:97%;"
          });
          dojo.place(bodyPrettyText.domNode, bodyPretty.domNode);
          containerCenterCenter.addChild(bodyPretty);
        } catch (Error) {
          //console.debug("text is not JSON");
        }

        if (ioArgs.xhr.status !== 0) {
          var table = dojo.create("table");
          var headers = ioArgs.xhr.getAllResponseHeaders().split("\n");
          headers.forEach(function (header, i) {
            var split = header.split(": ");
            if (split[0]) {
              var tr = dojo.create("tr");
              var th = dojo.create("th", {innerHTML:escapeHTML(split[0])});
              var td = dojo.create("td", {innerHTML:escapeHTML(split[1])});
              dojo.place(th, tr);
              dojo.place(td, tr);
              dojo.place(tr, table);
            }
          });
          var headerContent = new dijit.TitlePane({
            title:"HTTP Response Headers",
            open:formData.openHeader[0],
            content:table
          });
          dojo.place(headerContent.domNode, containerBottomCenter.domNode);
        }

        var request = new dijit.TitlePane({
          title:"Your Request Data",
          open:formData.openRequest[0],
          content:dojo.toJson(ioArgs.args, true, "<br>&nbsp;&nbsp;&nbsp;&nbsp;")
        });
        dojo.place(request.domNode, containerBottomCenter.domNode);

        return {center:containerCenter, bottom:containerBottom};
      };

      var generateRequestObject = function () {
        var requestObject = {};
        requestObject.headers = {};
        requestObject.postData = "";

        dojo.mixin(requestObject, formCommon.get("value"));
        dojo.mixin(requestObject.headers, formHeaders.get("value"));
        if (formOtherHeaders.get("value")) {
          try {
            dojo.mixin(requestObject.headers, dojo.fromJson(formOtherHeaders.get("value")));
          } catch (e) {
            console.error(e);
          }
        }
        requestObject.postData = formBody.get("value");

        return requestObject;
      };

      var saveRequest = function (number) {
        var requestObject = generateRequestObject();
        if (formOtherHeaders.get("value")) {
          requestObject.OtherHeaders = formOtherHeaders.get("value");
        } else {
          requestObject.OtherHeaders = "";
        }
        localStorage[number] = dojo.toJson(requestObject);
      };

      var loadRequest = function (number) {
        var requestObject = dojo.fromJson(localStorage[number]);
        if (requestObject) {
          formCommon.set("value", requestObject);
          formBody.set("value", requestObject.postData);
          formOtherHeaders.set("value", requestObject.OtherHeaders);
          formHeaders.set("value", requestObject.headers);
        }
      };

      var isSetRequest = function(number) {
        return (localStorage[number]);
      };

      var deleteRequest = function (number) {
        localStorage.removeItem(number);
      };

      var refreshRequest = function() {
        dojo.query('[data-poster-load]').forEach(function (node, i) {
          var num = node.getAttribute('data-poster-load');
          if (isSetRequest(num)) {
            dijit.byId(node.id).set("disabled", false);
          } else {
            dijit.byId(node.id).set("disabled", true);
          }
        });
      };

      var refreshSeries = function (number) {
        var seriesList = dojo.fromJson(localStorage['seriesList']);
        if (!seriesList) {
          seriesList = [];
        }
        var popCount = 0;
        for (var i=seriesList.length-1; i>=0; i--) {
          if (seriesList[i] === null) {
            popCount++;
          } else {
            break;
          }
        }
        while(popCount) {
          seriesList.pop();
          popCount--;
        }
        localStorage['seriesList'] = dojo.toJson(seriesList);

        dojo.query('[data-poster-series-select]').forEach(function (selector) {
          var storeData = [];
          var isDefault = selector.getAttribute('data-poster-series-select') === "true" ? true : false;
          if (isDefault) {
            storeData.push({'id':0, "label":"Default (1-5)", "value":"Default", selected:true});
          }
          if (seriesList) {
            dojo.forEach(seriesList, function (series, i) {
              if (series !== null) {
                storeData.push({'id':i + 1, "label":series + " (" + parseInt((i + 1) * 5 + 1, 10) + "-" + parseInt((i + 1) * 5 + 5, 10) + ")", value:series})
              }
            });
          }
          var store = new memoryStore({identifier:"id", labelAttr:"label", data:storeData});
          var selectorDijit = dijit.byId(selector.id);
          selectorDijit.set('store', store);
          if (number !== undefined) {
            selectorDijit.set('item', {id: number+1, value: seriesList[number]});
          } else if (isDefault) {
            selectorDijit.set('item', {id: 0, value:'Default'});
          } else {
            selectorDijit.set('item', {id: 0, value:''});
          }
        });
        refreshRequest();
      };

      var changeSeries = function (selectedItem) {
        dojo.query('[data-poster-series-save-label]').forEach(function (node, i) {
          var newNumber = parseInt((selectedItem.id) * 5 + i + 1, node, 10);
          dojo.place(dojo.doc.createTextNode('Save #' + newNumber + ":"), node, 'only');
        });
        dojo.query('[data-poster-save]').forEach(function (node, i) {
          var newNumber = parseInt((selectedItem.id) * 5 + i, node, 10);
          var num = node.getAttribute('data-poster-save');
          if (num !== "0") {
            node.setAttribute('data-poster-save', newNumber);
          }
        });
        dojo.query('[data-poster-load]').forEach(function (node, i) {
          var newNumber = parseInt((selectedItem.id) * 5 + i, node, 10);
          var num = node.getAttribute('data-poster-load');
          if (num !== "0") {
            node.setAttribute('data-poster-load', newNumber);
          }
        });
        refreshRequest();
      };

      var createSeries = function (title) {
        var seriesList = dojo.fromJson(localStorage['seriesList']);
        if (!seriesList) {
          seriesList = [];
        }
        if (title === "") {
          title = "(blank)";
        }
        seriesList.push(title);
        localStorage['seriesList'] = dojo.toJson(seriesList);
        return seriesList.length -1;
      };

      var deleteSeries = function (seriesItem) {
        var seriesList = dojo.fromJson(localStorage['seriesList']);
        if (!seriesList) {
          seriesList = [];
        }
        var targetId = parseInt(seriesItem.id, 10) - 1;
        delete seriesList[targetId];
        localStorage['seriesList'] = dojo.toJson(seriesList);

        for (var i = (targetId + 1) * 5 + 1; i < (targetId + 1) * 5 + 6; i++) {
          deleteRequest(i);
        }
      };

      var updateSeries = function(seriesItem, newTitle) {
        var seriesList = dojo.fromJson(localStorage['seriesList']);
        if (!seriesList) {
          seriesList = [];
        }
        if (newTitle === "") {
          newTitle = "(blank)";
        }
        var targetId = parseInt(seriesItem.id, 10) - 1;
        seriesList[targetId] = newTitle;
        localStorage['seriesList'] = dojo.toJson(seriesList);
        return targetId;

      };

      var escapeHTML = function (value) {
        return value.toString().replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;")
      };

      //event initialization

      dojo.query('[data-poster-request]').forEach(function (node, i) {
        dojo.connect(node, node.getAttribute("data-poster-event-type"), function () {
          send(node.getAttribute("data-poster-request"));
        });
      });

      dojo.query('[data-poster-save]').forEach(function (node, i) {
        dojo.connect(node, node.getAttribute("data-poster-event-type"), function () {
          saveRequest(node.getAttribute("data-poster-save"));
        });
      });

      dojo.query('[data-poster-load]').forEach(function (node, i) {
        dojo.connect(node, node.getAttribute("data-poster-event-type"), function () {
          loadRequest(node.getAttribute("data-poster-load"));
        });
      });

      dojo.query('[data-poster-series-select]').forEach(function (node, i) {
        var eventName = node.getAttribute("data-poster-event-type");
        var node = dijit.byId(node.id);
        eventName = eventName[0].toUpperCase() + eventName.substring(1);
        dojo.connect(node, 'on' + eventName, function (selected) {
          changeSeries(node.get('item'));
        });
      });

      dojo.query('[data-poster-series-delete]').forEach(function (node, i) {
        dojo.connect(node, node.getAttribute("data-poster-event-type"), function () {
          var number = deleteSeries(dijit.byId(node.getAttribute("data-poster-series-delete")).get('item'));
          refreshSeries();
          seriesCreateDialog.hide();
        });
      });

      dojo.query('[data-poster-series-showDialog]').forEach(function (node, i) {
        dojo.connect(node, node.getAttribute("data-poster-event-type"), function () {
          seriesCreateDialog.show();
        });
      });

      dojo.query('[data-poster-series-create]').forEach(function (node, i) {
        dojo.connect(node, node.getAttribute("data-poster-event-type"), function () {
          var number = createSeries(dijit.byId(node.getAttribute("data-poster-series-create")).get('value'));
          refreshSeries(number);
          seriesCreateDialog.hide();
        });
      });

      dojo.query('[data-poster-series-update]').forEach(function (node, i) {
        dojo.connect(node, node.getAttribute("data-poster-event-type"), function () {
          var obj = dojo.fromJson(node.getAttribute("data-poster-series-update"));
          var number = updateSeries(dijit.byId(obj.from).get("item"), dojo.byId(obj.to).value);
          refreshSeries(number);
          seriesCreateDialog.hide();
        });
      });

      refreshSeries();
    });
  });
})();