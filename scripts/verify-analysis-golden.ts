/**
 * 고급 분석 유틸 골든 체크 (tsx scripts/verify-analysis-golden.ts)
 */
import {
  wilsonScoreInterval,
  benjaminiHochbergReject,
  cohensH,
  classicalSTL,
  kaplanMeierEstimate,
  buildFirstReturnKmSeries,
  populationStabilityIndex,
  twoSidedNormalP,
} from '../lib/utils/advanced-analysis'

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error('FAIL:', msg)
    process.exit(1)
  }
}

const w = wilsonScoreInterval(7, 10, 0.95)
assert(w.low < w.high && w.low >= 0 && w.high <= 1, 'wilson bounds')
assert(w.center > 0.5 && w.center < 0.95, 'wilson center 7/10')

const bh = benjaminiHochbergReject([0.01, 0.04, 0.2, 0.8], 0.1)
assert(bh.length === 4, 'bh length')
// smallest p should often pass under lenient q

const h = cohensH(0.8, 0.2)
assert(Math.abs(h) > 0.5, 'cohens h magnitude')

const stl = classicalSTL([10, 12, 8, 14, 9, 11], [1, 2, 3, 4, 5, 6], 3)
assert(stl.trend.length === 6 && stl.residual.length === 6, 'stl lengths')

const kmIn = buildFirstReturnKmSeries([30, null, 60], [null, 45, null])
const km = kaplanMeierEstimate(kmIn.times, kmIn.eventOccurred)
assert(km.length >= 1, 'km curve')

const psi = populationStabilityIndex([10, 20, 30], [12, 18, 35])
assert(psi >= 0 && psi < 1, 'psi small shift')

const pz = twoSidedNormalP(1.96)
assert(pz > 0.02 && pz < 0.15, `twoSidedNormalP(1.96) plausible range got ${pz}`)

console.log('OK: verify-analysis-golden passed')
