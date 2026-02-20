export interface BaseResponse {
  status: string;
  message: string;
}

// DS001: Disclosure Search
export interface Disclosure {
  corp_cls: string;
  corp_name: string;
  corp_code: string;
  stock_code: string;
  report_nm: string;
  rcept_no: string;
  flr_nm: string;
  rcept_dt: string;
  rm: string;
}

export interface DisclosureSearchResponse extends BaseResponse {
  page_no: number;
  page_count: number;
  total_count: number;
  total_page: number;
  list: Disclosure[];
}

// DS002: Periodic Report Information
export interface PeriodicReportResponse extends BaseResponse {
  list: Record<string, any>[];
}

// DS001/DS002: Company Overview
export interface CompanyOverviewResponse extends BaseResponse {
  corp_name: string;
  corp_name_eng: string;
  stock_name: string;
  stock_code: string;
  ceo_nm: string;
  corp_cls: string;
  jurir_no: string;
  bizr_no: string;
  adr: string;
  hm_url: string;
  ir_url: string;
  phn_no: string;
  fax_no: string;
  induty_code: string;
  est_dt: string;
  acc_mt: string;
}

// DS003: Financial Statement
export interface FinancialItem {
  rcept_no: string;
  reprt_code: string;
  bsns_year: string;
  corp_code: string;
  sj_div: string;
  sj_nm: string;
  account_id: string;
  account_nm: string;
  account_detail: string;
  thstrm_nm: string;
  thstrm_amount: string;
  thstrm_add_amount: string;
  frmtrm_nm: string;
  frmtrm_amount: string;
  frmtrm_q_nm: string;
  frmtrm_q_amount: string;
  frmtrm_add_amount: string;
  bfefrmtrm_nm: string;
  bfefrmtrm_amount: string;
  ord: string;
  currency: string;
}

export interface FinancialStatementResponse extends BaseResponse {
  list: FinancialItem[];
}

// DS004: Major Shareholder Status
export interface MajorShareholder {
  rcept_no: string;
  rcept_dt: string;
  corp_code: string;
  corp_name: string;
  report_tp: string;
  repror: string;
  stkqy: string;
  stkqy_irds: string;
  stkrt: string;
  stkrt_irds: string;
  ctr_stkqy: string;
  ctr_stkrt: string;
  report_resn: string;
}

export interface MajorShareholderResponse extends BaseResponse {
  list: MajorShareholder[];
}

// DS005: Paid-in Capital Increase
export interface CapitalIncrease {
  rcept_no: string;
  corp_cls: string;
  corp_code: string;
  corp_name: string;
  nstk_ostk_cnt: string;
  nstk_estk_cnt: string;
  fv_ps: string;
  bfic_tisstk_ostk: string;
  bfic_tisstk_estk: string;
  fdpp_fclt: string;
  fdpp_bsninh: string;
  fdpp_op: string;
  fdpp_dtrp: string;
  fdpp_ocsa: string;
  fdpp_etc: string;
  ic_mthn: string;
  ssl_at: string;
  ssl_bgd: string;
  ssl_edd: string;
}

export interface CapitalIncreaseResponse extends BaseResponse {
  list: CapitalIncrease[];
}

// DS006: Equity Securities
export interface EquitySecurity {
  rcept_no: string;
  corp_cls: string;
  corp_code: string;
  corp_name: string;
  sbd: string;
  pymd: string;
  sband: string;
  asand: string;
  asstd: string;
  exstk: string;
  exprc: string;
  expd: string;
  rpt_rcpn: string;
}

export interface EquitySecuritiesResponse extends BaseResponse {
  list: EquitySecurity[];
}

// DS001: Corporate Code
export interface CorpCode {
  corp_code: string;
  corp_name: string;
  stock_code: string;
  modify_date: string;
}

