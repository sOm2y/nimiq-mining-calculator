import React from 'react';
import PropTypes from 'prop-types';
import {withStyles} from 'material-ui/styles';
import Card, {CardContent, CardHeader} from 'material-ui/Card';
import Input, {InputLabel} from 'material-ui/Input';
import {MenuItem} from 'material-ui/Menu';
import {FormControl} from 'material-ui/Form';
import Typography from 'material-ui/Typography';
import {Field, reduxForm} from 'redux-form';
import {Select, TextField} from 'redux-form-material-ui';
import Button from 'material-ui/Button';
import ProfitTable from 'components/ProfitTable';
import Grid from 'material-ui/Grid';
import ExpansionPanel, {ExpansionPanelSummary, ExpansionPanelDetails} from 'material-ui/ExpansionPanel';
import ExpandMoreIcon from 'material-ui-icons/ExpandMore';
import {connect} from "react-redux";
import IconButton from 'material-ui/IconButton';
import ShareIcon from 'material-ui-icons/Share';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import _ from 'lodash';

import {compose} from 'recompose';

const addParameterToURL = (param, value) => {
    var _url = window.location.href;
    _url += ( _url.match(/[\?]/g) ? '&' : '?' ) + param + '=' + value;
    window.location.href = _url;
}

const styles = theme => ({
    container: {
        display: 'flex',
        flexWrap: 'wrap',
        alignContent: 'space-between'
    },
    card: {
        minWidth: 275,
        border: '1px solid #D9DEE4'
    },
    title: {
        marginBottom: 16,
        fontSize: 14,
        color: theme.palette.text.secondary,
    },
    textField: {
        marginLeft: theme.spacing.unit,
        marginRight: theme.spacing.unit,
        marginBottom: 15
    },
    calcWrap: {
        padding: 30
    },
    formControl: {
        minWidth: '100%'
    }
});

const convertToH = (_rate, _unit) => {
    var _H = parseFloat(_rate);

    switch (_unit) {
        case 'h':
            return _H;
            break;
        case 'kh':
            return _H * 1000;
            break;
        case 'mh':
            return _H * 1000000;
            break;
        case 'gh':
            return _H * 1000000000;
            break;
        case 'th':
            return _H * 1000000000000000;
            break;

    }
}


const _formatNumber = (num, price) => {
    let _num = num;

    if (price) {
        if (Math.abs(_num) >= 0.009) {
            _num = num.toFixed(2)
        }

        if (Math.abs(_num) < 0.009) {
            console.log('num', num)
            _num = num.toFixed(6)
        }
    } else {
        if (Math.abs(_num) < 1) {
            _num = parseFloat(num.toFixed(6))
        }

        if (Math.abs(_num) > 1) {
            _num = parseFloat(num.toFixed(0))
        }
    }
    return _num
}

const defaultValues = {
    hashRate: 36,
    hashUnit: 'kh',
    powerConsumption: 400,
    kwhCost: 0.10,
    poolFee: 1,
    globalHashRate: 200,
    globalHashUnit: 'mh',
    blockTime: 60,
    reward: 5000,
    price: 0.05,
    hardwareCost: 1000
}

class Calculator extends React.Component {

    state = {
        statistics: null,
        values: null
    }

    componentDidMount() {
        this.setState({
            values: defaultValues
        })
        this.submit(this.checkForParams(defaultValues));
        this.createShareUrl(defaultValues)
    }

    checkForParams = (_defaultValues) => {
        var _params = window.location.search.substring(1).split('&');
        _.each(_params, (param) => {
            var paramSplit = param.split('=');
            if (_defaultValues[paramSplit[0]]) {
                _defaultValues[paramSplit[0]] = paramSplit[1]
            }
        })
        return defaultValues;
    }

    createShareUrl(_values) {
        console.log('_values ', _values)
        var _initialValues = _values;
        var _params = '';
        _.each(Object.keys(_initialValues), (valueKey, index) => {
            _params += `${valueKey}=${_initialValues[valueKey]}`
            if (index < (Object.keys(_initialValues).length - 1)) {
                _params += '&'
            }
        })
        this.setState({
            copyUrl: 'https://nimiqminer.com?' + _params
        })
    }

    submit = (values) => {
        this.setState({
            values: values
        })
        this.calculateProfit(values)
        this.createShareUrl(values)
    }

    calculateProfit = (values) => {
        let _hashRate = convertToH(values.hashRate, values.hashUnit);
        const myWinProbability = _hashRate / convertToH(parseFloat(values.globalHashRate), values.globalHashUnit);
        var expectedHashTime = (1 / myWinProbability) * parseFloat(values.blockTime);
        var numWinning = (86400 / expectedHashTime);
        var mined = parseFloat(numWinning) * parseFloat(values.reward);
        var totalProfit = parseFloat(mined) * parseFloat(values.price);
        var poolFee = parseFloat(totalProfit) * parseFloat(values.poolFee) / 100;
        var powerCost = (parseFloat(values.powerConsumption) / 1000) * 24 * parseFloat(values.kwhCost);
        var statistics = {
            day: {
                profit: _formatNumber(totalProfit - poolFee - powerCost, true),
                poolFee: _formatNumber(poolFee, true),
                mined: _formatNumber(mined),
                powerCost: _formatNumber(powerCost, true)
            }
        }


        statistics.week = {
            profit: _formatNumber(statistics.day.profit * 7, true),
            poolFee: _formatNumber(statistics.day.poolFee * 7, true),
            mined: _formatNumber(statistics.day.mined * 7),
            powerCost: _formatNumber(statistics.day.powerCost * 7, true)
        }

        statistics.month = {
            profit: _formatNumber(statistics.day.profit * 30, true),
            poolFee: _formatNumber(statistics.day.poolFee * 30, true),
            mined: _formatNumber(statistics.day.mined * 30),
            powerCost: _formatNumber(statistics.day.powerCost * 30, true)
        }

        statistics.year = {
            profit: _formatNumber(statistics.day.profit * 365, true),
            poolFee: _formatNumber(statistics.day.poolFee * 365, true),
            mined: _formatNumber(statistics.day.mined * 365),
            powerCost: _formatNumber(statistics.day.powerCost * 365, true)
        }

        this.setState({
            statistics: statistics
        })

    }

    render() {
        const {classes, handleSubmit} = this.props;
        return (
            <Grid container style={{maxWidth: 1024, margin: '0 auto'}} spacing={0}>
                <Grid item xs={12} sm={5}>
                    <div className={classes.calcWrap}>
                        <Card className={classes.card} elevation={0}>
                            <CardHeader
                                title="Mining Calculator"
                                action={
                                    <CopyToClipboard text={this.state.copyUrl} onCopy={() => this.setState({copied: true})}>
                                        <IconButton>
                                            <ShareIcon/>
                                        </IconButton>
                                    </CopyToClipboard>
                                }
                            />
                            <CardContent>
                                <form onSubmit={handleSubmit(this.submit)} className={classes.container}>
                                    <Grid container>
                                        <Grid item xs={7}>
                                            <Field name="hashRate" component={TextField} label="Hashing Power"
                                                   className={classes.textField} required/>
                                        </Grid>
                                        <Grid item xs={5}>
                                            <FormControl className={classes.formControl}>
                                                <InputLabel htmlFor="hashUnit">Hash Unit</InputLabel>
                                                <Field
                                                    name="hashUnit"
                                                    component={Select}
                                                    inputfield={<Input id="hashing-Unit" label="Hash Unit"/>}
                                                    value="h"
                                                    fullWidth
                                                >
                                                    <MenuItem value="h">H/s</MenuItem>
                                                    <MenuItem value="kh">KH/s</MenuItem>
                                                    <MenuItem value="mh">MH/s</MenuItem>
                                                    <MenuItem value="gh">GH/s</MenuItem>
                                                    <MenuItem value="th">TH/s</MenuItem>
                                                </Field>
                                            </FormControl>
                                        </Grid>
                                    </Grid>
                                    <div className="cf"></div>
                                    <Field fullWidth name="hardwareCost" label="Hardware Cost ($)" component={TextField}
                                           placeholder="" className={classes.textField}/>
                                    <Field fullWidth name="powerConsumption" label="Power Consumption (w)"
                                           component={TextField} placeholder="Power Consumption"
                                           className={classes.textField} required/>
                                    <Field fullWidth name="kwhCost" label="Cost per KWH ($)" component={TextField}
                                           placeholder="" className={classes.textField} required/>
                                    <Field fullWidth name="poolFee" label="Pool Fee" component={TextField}
                                           placeholder="" className={classes.textField} required/>
                                    <ExpansionPanel elevation={0}>
                                        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                                            <Typography className={classes.heading}>Advanced</Typography>
                                        </ExpansionPanelSummary>
                                        <ExpansionPanelDetails className={classes.container}>
                                            <Grid container>
                                                <Grid item xs={7}>
                                                    <Field fullWidth name="globalHashRate" label="Global Hash Rate"
                                                           component={TextField} placeholder=""
                                                           className={classes.textField}/>
                                                </Grid>
                                                <Grid item xs={5}>
                                                    <FormControl className={classes.formControl}>
                                                        <InputLabel htmlFor="globalHashUnit">Hash Unit</InputLabel>
                                                        <Field
                                                            name="globalHashUnit"
                                                            component={Select}
                                                            inputfield={<Input id="hashing-Unit" label="Hash Unit"/>}
                                                            value="h"
                                                            fullWidth
                                                        >
                                                            <MenuItem value="h">H/s</MenuItem>
                                                            <MenuItem value="kh">KH/s</MenuItem>
                                                            <MenuItem value="mh">MH/s</MenuItem>
                                                            <MenuItem value="gh">GH/s</MenuItem>
                                                            <MenuItem value="th">TH/s</MenuItem>
                                                        </Field>
                                                    </FormControl>
                                                </Grid>
                                            </Grid>
                                            <Field fullWidth defaultValue={60} name="blockTime" label="Block Time (sec)"
                                                   component={TextField} placeholder="" className={classes.textField}/>
                                            <Field fullWidth name="reward" label="Block Reward (NIM)"
                                                   component={TextField} placeholder="" className={classes.textField}/>
                                            <Field fullWidth name="price" label="NIM Price ($)" component={TextField}
                                                   placeholder="" className={classes.textField}/>
                                        </ExpansionPanelDetails>
                                    </ExpansionPanel>
                                    <Button type="submit" variant="raised">Calculate</Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </Grid>
                <Grid item xs={12} sm={7}>
                    <ProfitTable statistics={this.state.statistics} initialValues={this.state.values}/>
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="caption" component="p" align="center" gutterBottom>
                        The estimated expected cryptocurrency earnings are based on a statistical calculation using the
                        values entered and do not account for difficulty and exchange rate fluctuations,
                        stale/reject/orphan rates, and a pool's efficiency. If you are mining using a pool, the
                        estimated expected cryptocurrency earnings can vary greatly depending on the pool's efficiency,
                        stale/reject/orphan rate, and fees. If you are mining solo, the estimated expected
                        cryptocurrency earnings can vary greatly depending on your luck and stale/reject/orphan rate.
                    </Typography>
                    <Typography variant="caption" component="p" align="center">
                        This web application is built on top of the <a href="https://nimiq.com" target="_blank">Nimiq Blockchain</a>. <a href="https://github.com/bradrisse/nimiq-mining-calculator" target="_blank">View Source Code on Github</a>.
                    </Typography>
                </Grid>
            </Grid>
        )
    }
}

Calculator.propTypes = {
    classes: PropTypes.object.isRequired,
};

function mapStateToProps(state, props) {
    return {
        cmc: state.cmc,
        initialValues: defaultValues
    }
}

export default compose(
    withStyles(styles),
    connect(mapStateToProps),
    reduxForm({form: 'miningCalc'}, mapStateToProps),
)(Calculator);