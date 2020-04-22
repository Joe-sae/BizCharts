import React from 'react';
import uniqueId from '@antv/util/lib/unique-id';
import _isFunction from '@antv/util/lib/is-function';
import ErrorBoundary from '../../boundary/ErrorBoundary';
import withContainer from '../../boundary/withContainer';
import { Chart as _Chart } from '../../core';
import RootChartContext from '../../context/root';
import warn from '../../utils/warning';

import { IChart, IEvent } from '../../interface';

import {
  BASE_EVENT_NAMES,
  DRAG_EVENT_NAMES,
  MOBILE_EVENT_NAMES,
  LIFE_CIRCLE_NAMES,
  AXIS_EVENT_TARGET,
  LEGEND_EVENT_TARGETS,
  ANNOTATION_EVENT_TARGET,
  LEGEND_EVENT,
  TOOLTIP_EVENT,
} from './events';

import View, { IView } from '../View';

function toHump(name) {
  return name.replace(/\:/g,'-').replace(/\-(\w)/g, function(all, letter){
      return letter.toUpperCase();
  }).replace(/^\S/, s => s.toUpperCase());
}


class Chart extends View<IChart> {
  static defaultProps = {
    placeholder: <div style={{ position: 'relative', top: '48%', textAlign: 'center' }}>暂无数据</div>,
    visible: true,
  }
  ChartBaseClass: any = _Chart;
  initInstance() {
    this.id = uniqueId(this.name);
    const options = this.getInitalConfig();
    this.g2Instance = new this.ChartBaseClass(options);
    if (options.pure) {
      this.g2Instance.axis(false);
      this.g2Instance.tooltip(false);
    } else {
      this.g2Instance.tooltip({ showMarkers: false });
    }
    this.bindEvents();
  }
  bindEvents() {
    // 画布事件
    [ ...BASE_EVENT_NAMES, ...DRAG_EVENT_NAMES, ...MOBILE_EVENT_NAMES, ...LIFE_CIRCLE_NAMES ].forEach(eName => {
      const propsEventName = `on${toHump(eName)}`;
      this.g2Instance.on(eName, (args: IEvent) => {
        if (_isFunction(this.props[propsEventName])) {
          if (args) {
            this.props[propsEventName](args, this.g2Instance);
          } else {
            // 生命周期是没有 args
            this.props[propsEventName](this.g2Instance);
          }
        }
      })
    });
    // 组件事件
    [...BASE_EVENT_NAMES, ...DRAG_EVENT_NAMES, ...MOBILE_EVENT_NAMES].forEach(eName => {
      [ ...AXIS_EVENT_TARGET, ...LEGEND_EVENT_TARGETS, ...ANNOTATION_EVENT_TARGET ].forEach((target) => {
        const propsEventName = `on${toHump(target)}${toHump(eName)}`;
        this.g2Instance.on(`${target}:${eName}`, (args: IEvent) => {
          if (_isFunction(this.props[propsEventName])) {
            this.props[propsEventName](args, this.g2Instance);
          }
        })
      })
    });
    // 组件特殊事件
    [ ...LEGEND_EVENT, ...TOOLTIP_EVENT].forEach(eName => {
      const propsEventName = `on${toHump(eName)}`;
      this.g2Instance.on(eName, (args: IEvent) => {
        if (_isFunction(this.props[propsEventName])) {
          this.props[propsEventName](args, this.g2Instance);
        }
      })
    })
  }
  getInitalConfig() {
    const config = { ...this.props };
    if (config.forceFit !== undefined) {
      warn(false, 'forceFit 将会在4.1后不再支持，请使用`autoFit`替代');
      config.autoFit = config.forceFit;
    }

    return config;
  }

  componentDidMount() {
    if (!this.g2Instance) {
      return;
    }
    super.componentDidMount();
    if (this.g2Instance) {
      this.g2Instance.render();
      if (_isFunction(this.props.onGetG2Instance)) {
        this.props.onGetG2Instance(this.g2Instance);
      }
    }
  }

  componentDidUpdate(perProps) {
    if (!this.g2Instance) {
      return;
    }
    this.configInstance(perProps, this.props);
    this.g2Instance.render();
  }

  componentWillUnmount() {
    this.destroy();
  }

  destroy() {
    if (this.g2Instance) {
      this.g2Instance.destroy();
      this.g2Instance = null;
    }
  }

  render() {
    if (this.props.data === undefined) {
      this.destroy();
      return <ErrorBoundary>
        {this.props.placeholder}
      </ErrorBoundary>
    }
    this.getInstance();
    return (
      <ErrorBoundary>
        <RootChartContext.Provider value={{ chart: this.g2Instance }}>
          {super.render()}
        </RootChartContext.Provider>
      </ErrorBoundary>
    );
  }
}

export default withContainer<IChart>(Chart);