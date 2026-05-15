/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import * as React from "react";
import {NullLogging} from "./logging";
import theme from "./theme";

import {ReactComponent as SquareLogo} from "./squareLogo.svg";
import {ReactComponent as HorizontalLogo} from "./horizontalLogo.svg";

const defaultDeployment = {
    chakraTheme: theme,
    logging: new NullLogging(),
    squareLogo: <SquareLogo />,
    horizontalLogo: <HorizontalLogo />,
    guideLink: "https://calliope.cc/programmieren/editoren/python",
    termsOfUseLink: "https://calliope.cc/nutzungshinweise",
    dataProtectionLink: "https://calliope.cc/dataprotection",
    imprintLink: "https://calliope.cc/impressum",
};

export default defaultDeployment;
