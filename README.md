# 📦 Tracktry Card

This card is for [Lovelace](https://www.home-assistant.io/lovelace) on [Home Assistant](https://www.home-assistant.io/) 0.92+ to display your data from the Tracktry sensor. Based on the Aftership-card

Note: Remove trackings by long pressing on the icon

![example](example.png)

## Installation

Use [HACS](https://hacs.xyz) or follow this [guide](https://github.com/thomasloven/hass-config/wiki/Lovelace-Plugins)

```yaml
resources:
  url: /local/tracktry-card.js
  type: module
```

## Options

| Name     | Type   | Requirement  | Description                                                                           |
| -------- | ------ | ------------ | ------------------------------------------------------------------------------------- |
| type     | string | **Required** | `custom:tracktry-card`                                                               |
| entity   | string | **Required** | [Tracktry](https://www.home-assistant.io/components/sensor.tracktry/) sensor entity |
| title    | string | **Optional** | Card title `Tracktry`                                                                |
| show_add | bool   | **Optional** | Show fields to add a new package to track                                             |

## Usage

```yaml
type: 'custom:tracktry-card'
entity: sensor.tracktry
title: Packages
```

[Troubleshooting](https://github.com/thomasloven/hass-config/wiki/Lovelace-Plugins)
