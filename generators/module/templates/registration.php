<?php

use Magento\Framework\Component\ComponentRegistrar;

ComponentRegistrar::register(
    ComponentRegistrar::MODULE,
    "<%= vendor.name %>_<%= module.name %>",
    __DIR__
);
