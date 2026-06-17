import { ChartTypeV2 } from '../preload/chart-types'

let gimmicks = {}
let globalMods = {
  unknown: 0
}
let modWeight = {
  unknown: 0
}
let globalModIndex = 0

type vsbNote = {
  time: number
  lane: number
  type: number
  extra: any
}
type vsbMod = {
  b: number // time/beat
  d: number // dur
  e: string // ease
  v1: number // v1
  v2: number // v2
  mi: number // mod-byte
  p: number // proxy
  m: string // modname
  w: number // mod-weight
}
type vsbPerframe = {
  b: number
  e: number
  f: string
}
type vsbModData = {
  data: {
    proxies: number
    obj: string
  }
  mods: vsbMod[]
  perFrame: vsbPerframe[]
  count_no_loop?: number
  count_loop?: number
}

function addGlobalMod(name, weight) {
  let i = globalModIndex
  if (i >= 128) return
  globalModIndex++

  globalMods[name] = i
  modWeight[name] = weight
}

function addGimmick(name, extraMods) {
  let gimmick = { extraMods: {} }
  let index = 0
  for (let mod of extraMods) {
    gimmick.extraMods[mod[0]] = index | 128
    modWeight[mod[0]] = mod[1] ?? 1
    index++
  }
  gimmicks[name] = gimmick
}

addGlobalMod('prx', 2)
addGlobalMod('prxb', 2)
addGlobalMod('prxc', 2)
addGlobalMod('pry', 2)
addGlobalMod('pryb', 2)
addGlobalMod('pryc', 2)
addGlobalMod('prsx', 2)
addGlobalMod('pra', 2)
addGlobalMod('przm', 2)
addGlobalMod('przmb', 2)
addGlobalMod('przx', 2)
addGlobalMod('przy', 2)
addGlobalMod('prrx', 2)
addGlobalMod('prry', 2)
addGlobalMod('prrz', 2)
addGlobalMod('prrzb', 2)
addGlobalMod('shxs', 1.5)
addGlobalMod('shxp', 1.5)
addGlobalMod('shxa', 1.5)
addGlobalMod('shys', 1.5)
addGlobalMod('shyp', 1.5)
addGlobalMod('shya', 1.5)
addGlobalMod('scrollspeed', 0)
addGlobalMod('noterot', 2.5)
addGlobalMod('velocity', 2)
addGlobalMod('spinradius', 2)
addGlobalMod('spiny', 2)
addGlobalMod('spinx', 2)
addGlobalMod('driven', 4)
addGlobalMod('beat', 1.5)
addGlobalMod('wave', 2.5)
addGlobalMod('hom', 2)
addGlobalMod('boost_distance', 2.5)
addGlobalMod('boost_time', 2.5)
addGlobalMod('yoffset', 1.5)
addGlobalMod('notealp', 1.5)
addGlobalMod('przmc', 1)
addGlobalMod('prxd', 1)
addGlobalMod('pryd', 1)
addGlobalMod('prct', 1)
addGlobalMod('prcb', 1)
addGlobalMod('prcl', 1)
addGlobalMod('prcr', 1)
addGlobalMod('prvib', 1)
addGlobalMod('shct', 1)
addGlobalMod('shft', 1)
addGlobalMod('shcb', 1)
addGlobalMod('shfb', 1)
addGlobalMod('shcl', 1)
addGlobalMod('shfl', 1)
addGlobalMod('shcr', 1)
addGlobalMod('shfr', 1)
addGlobalMod('scrollind0', 1.5)
addGlobalMod('scrollind1', 1.5)
addGlobalMod('scrollind2', 1.5)
addGlobalMod('scrollind3', 1.5)
addGlobalMod('scrollind4', 1.5)
addGlobalMod('scrollind5', 1.5)
addGlobalMod('scrollind6', 1.5)
addGlobalMod('drawdist', 0)
addGlobalMod('pburstleft', 0.5)
addGlobalMod('pburstright', 0.5)
addGlobalMod('particlexpower', 0.5)
addGlobalMod('particleypower', 0.5)
addGlobalMod('uialpha', 0)
addGlobalMod('fx_contrast', 0.5)
addGlobalMod('fx_chroma_distort', 0.5)
addGlobalMod('fx_film', 1)
addGlobalMod('fx_glow', 1)
addGlobalMod('fx_particleglow', 0.5)
addGlobalMod('pburstspeed', 0.5)
addGlobalMod('freeze', 2)
addGlobalMod('drawuntil', 0)

// the horrors
addGimmick('obj___gimmick', [
  ['glitchamp'],
  ['glitchoffset'],
  ['fish'],
  ['vig'],
  ['bloom'],
  ['gray'],
  ['posx'],
  ['posy'],
  ['cover1'],
  ['cover2'],
  ['cover3'],
  ['twx1'],
  ['twy1'],
  ['twa1'],
  ['twr1'],
  ['twx2'],
  ['twy2'],
  ['twa2'],
  ['twr2'],
  ['twx3'],
  ['twy3'],
  ['twa3'],
  ['twr3'],
  ['twx4'],
  ['twy4'],
  ['twa4'],
  ['twr4'],
  ['sina'],
  ['sinp'],
  ['sino'],
  ['cosa'],
  ['cosp'],
  ['coso'],
  ['tana'],
  ['tanp'],
  ['tano'],
  ['static'],
  ['uialpha'],
  ['spinradiusx'],
  ['spinradiusz'],
  ['fakezy'],
  ['fakezyb'],
  ['float'],
  ['wiggly']
])
addGimmick('obj_00_gimmick', [['blipzoom'], ['blipalpha'], ['satal'], ['satx'], ['saty']])
addGimmick('obj_aleph_gimmick', [
  ['glitchamp'],
  ['uialpha'],
  ['scorealph'],
  ['bgalph'],
  ['noteoverlayalp'],
  ['sg_endblip'],
  ['glitchoffset'],
  ['uhnoise'],
  ['abberationxamp'],
  ['abberationyamp'],
  ['fish'],
  ['static'],
  ['sg_endblip_destroy'],
  ['sn_bg_alpha'],
  ['sn_bg_fxamp'],
  ['sn_bg_animspd'],
  ['yoffset']
])
addGimmick('obj_angelstar_gimmick', [
  ['uialpha'],
  ['cover1'],
  ['cover2'],
  ['cover3'],
  ['wflash'],
  ['rainbow'],
  ['sides'],
  ['notealp'],
  ['video'],
  ['noteoverlayalp'],
  ['shadermode'],
  ['scorealph'],
  ['bgalph'],
  ['gray'],
  ['barrel'],
  ['barrel2'],
  ['hdistort'],
  ['fish'],
  ['vig'],
  ['abx'],
  ['aby'],
  ['aberamp'],
  ['glitchamp'],
  ['glitchoffset'],
  ['uhnoise'],
  ['abberationxamp'],
  ['abberationyamp'],
  ['fish'],
  ['static'],
  ['fx_hue_hue'],
  ['fx_hue_saturation'],
  ['fx_edge'],
  ['fx_posterize'],
  ['fx_twirl'],
  ['fx_posterize_vis'],
  ['fx_underwater'],
  ['bloom'],
  ['angelstar_checker_alpha'],
  ['angelstar_checker_set'],
  ['fx_zoom'],
  ['fx_red'],
  ['recolor'],
  ['holdoverlayalpha']
])
addGimmick('obj_astellion_gimmick', [
  ['gray'],
  ['barrel'],
  ['barrel2'],
  ['hdistort'],
  ['fish'],
  ['vig'],
  ['abx'],
  ['aby'],
  ['aberamp'],
  ['uialpha'],
  ['cover1'],
  ['cover2'],
  ['cover3'],
  ['wflash'],
  ['rainbow'],
  ['sides'],
  ['notealp'],
  ['video'],
  ['noteoverlayalp'],
  ['astbars'],
  ['bgalph'],
  ['fxdist1'],
  ['fxdist2'],
  ['parttimer']
])
addGimmick('obj_convergence_gimmick', [
  ['glitchamp'],
  ['uialpha'],
  ['scorealph'],
  ['bgalph'],
  ['noteoverlayalp'],
  ['sg_endblip'],
  ['supernova_dialogue'],
  ['supernova_cg_xscale'],
  ['supernova_cg_alpha'],
  ['glitchoffset'],
  ['uhnoise'],
  ['abberationxamp'],
  ['abberationyamp'],
  ['fish'],
  ['static'],
  ['supernova_cg_frame'],
  ['sg_endblip_destroy'],
  ['sn_bg_alpha'],
  ['sn_bg2_alpha'],
  ['sn_bg_fxamp'],
  ['sn_bg_animspd'],
  ['setup_co']
])
addGimmick('obj_credits_gimmick', [['lyricIndex']])
addGimmick('obj_distortedfate_gimmick', [
  ['df_sideline'],
  ['df_whitebg'],
  ['df_grid_alpha'],
  ['df_grid_top'],
  ['df_grid_bottom'],
  ['df_sideline2'],
  ['gray'],
  ['barrel'],
  ['barrel2'],
  ['hdistort'],
  ['fish'],
  ['vig'],
  ['abx'],
  ['aby'],
  ['aberamp'],
  ['uialpha'],
  ['cover1'],
  ['cover2'],
  ['cover3'],
  ['wflash'],
  ['rainbow'],
  ['sides'],
  ['notealp'],
  ['video'],
  ['noteoverlayalp'],
  ['df_countdown'],
  ['lr_slash'],
  ['lr_slash_color'],
  ['lr_sides_blue'],
  ['lr_sides_red'],
  ['lr_sides_rev_blue'],
  ['lr_sides_rev_red'],
  ['lr_mountain_bg']
])
addGimmick('obj_dracula_gimmick', [
  ['cover1'],
  ['cover2'],
  ['cover3'],
  ['uialpha'],
  ['vib'],
  ['jart'],
  ['jdesat'],
  ['seedspeed'],
  ['wflash'],
  ['posx'],
  ['posy']
])
addGimmick('obj_extendnova_gimmick', [
  ['glitchamp'],
  ['uialpha'],
  ['scorealph'],
  ['bgalph'],
  ['noteoverlayalp'],
  ['sg_endblip'],
  ['supernova_dialogue'],
  ['supernova_cg_xscale'],
  ['supernova_cg_alpha'],
  ['glitchoffset'],
  ['uhnoise'],
  ['abberationxamp'],
  ['abberationyamp'],
  ['fish'],
  ['static'],
  ['supernova_cg_frame'],
  ['sg_endblip_destroy'],
  ['sn_bg_alpha'],
  ['sn_bg_fxamp'],
  ['sn_bg_animspd'],
  ['setup_co'],
  ['setup_co_en_s1'],
  ['setup_co_en_s2'],
  ['setup_co_en_s3'],
  ['setup_co_en_s4'],
  ['setup_co_en_s5'],
  ['setup_co_en_s6'],
  ['setup_co_en_s7'],
  ['setup_co_en_s8'],
  ['en_whiteoverlay'],
  ['en_voidparticles'],
  ['en_slash_sat'],
  ['en_posterize_vis'],
  ['en_posterize'],
  ['en_chorus_bg_alpha'],
  ['en_evildawn_hpbar_amount'],
  ['en_gun_dawn'],
  ['en_evildawn_hpbar_alpha'],
  ['en_evildawn_hpbar_shake'],
  ['en_enddrop_bg_alpha'],
  ['fx_edge']
])
addGimmick('obj_firstbreath_gimmick', [
  ['df_sideline'],
  ['df_whitebg'],
  ['df_grid_alpha'],
  ['df_grid_top'],
  ['df_grid_bottom'],
  ['df_sideline2'],
  ['gray'],
  ['barrel'],
  ['barrel2'],
  ['hdistort'],
  ['fish'],
  ['vig'],
  ['abx'],
  ['aby'],
  ['aberamp'],
  ['uialpha'],
  ['cover1'],
  ['cover2'],
  ['cover3'],
  ['wflash'],
  ['rainbow'],
  ['sides'],
  ['notealp'],
  ['video'],
  ['noteoverlayalp'],
  ['df_countdown'],
  ['lr_slash'],
  ['lr_slash_color'],
  ['lr_sides_blue'],
  ['lr_sides_red'],
  ['lr_sides_rev_blue'],
  ['lr_sides_rev_red'],
  ['lr_mountain_bg'],
  ['setup_co'],
  ['glitchamp'],
  ['supernova_cg_alpha'],
  ['supernova_cg_xscale'],
  ['supernova_cg_frame'],
  ['glitchoffset'],
  ['uhnoise'],
  ['abberationxamp'],
  ['abberationyamp'],
  ['sn_bg_alpha'],
  ['sn_bg_fxamp'],
  ['sn_bg_animspd']
])
addGimmick('obj_lastwish_gimmick', [
  ['uialpha'],
  ['bgalph'],
  ['film'],
  ['glow'],
  ['filmsat'],
  ['lwcover'],
  ['lwflickerspd'],
  ['lwjitterintensity'],
  ['lwchroma'],
  ['lwtext']
])
addGimmick('obj_libertia_gimmick', [
  ['glitchamp'],
  ['uialpha'],
  ['scorealph'],
  ['bgalph'],
  ['noteoverlayalp'],
  ['sg_endblip'],
  ['supernova_dialogue'],
  ['supernova_cg_xscale'],
  ['supernova_cg_alpha'],
  ['glitchoffset'],
  ['uhnoise'],
  ['abberationxamp'],
  ['abberationyamp'],
  ['fish'],
  ['static'],
  ['supernova_cg_frame'],
  ['sg_endblip_destroy'],
  ['sn_bg_alpha'],
  ['sn_bg_fxamp'],
  ['sn_bg_animspd'],
  ['setup_co']
])
addGimmick('obj_marenol_gimmick', [
  ['glitchamp'],
  ['glitchoffset'],
  ['fish'],
  ['posx'],
  ['posy'],
  ['cover1'],
  ['cover2'],
  ['cover3'],
  ['twx1'],
  ['twy1'],
  ['twa1'],
  ['twr1'],
  ['twx2'],
  ['twy2'],
  ['twa2'],
  ['twr2'],
  ['twx3'],
  ['twy3'],
  ['twa3'],
  ['twr3'],
  ['twx4'],
  ['twy4'],
  ['twa4'],
  ['twr4'],
  ['sina'],
  ['sinp'],
  ['sino'],
  ['cosa'],
  ['cosp'],
  ['coso'],
  ['tana'],
  ['tanp'],
  ['tano'],
  ['static'],
  ['vibx'],
  ['viby'],
  ['uialpha'],
  ['flicker']
])
addGimmick('obj_memories_gimmick', [
  ['glitchamp'],
  ['uialpha'],
  ['scorealph'],
  ['bgalph'],
  ['noteoverlayalp'],
  ['sg_endblip'],
  ['supernova_dialogue'],
  ['supernova_cg_xscale'],
  ['supernova_cg_alpha'],
  ['glitchoffset'],
  ['uhnoise'],
  ['abberationxamp'],
  ['abberationyamp'],
  ['fish'],
  ['static'],
  ['supernova_cg_frame'],
  ['sg_endblip_destroy'],
  ['sn_bg_alpha'],
  ['sn_bg_fxamp'],
  ['sn_bg_animspd'],
  ['setup_co']
])
addGimmick('obj_multigrode_gimmick', [
  ['glitchamp'],
  ['uialpha'],
  ['scorealph'],
  ['bgalph'],
  ['noteoverlayalp'],
  ['sg_endblip'],
  ['glitchoffset'],
  ['uhnoise'],
  ['abberationxamp'],
  ['abberationyamp'],
  ['fish'],
  ['static'],
  ['sg_endblip_destroy'],
  ['sn_bg_alpha'],
  ['sn_bg_fxamp'],
  ['sn_bg_animspd'],
  ['yoffset'],
  ['dialogue_size'],
  ['text_alpha'],
  ['dialogue_id'],
  ['fruitmemoryx'],
  ['refreshdialogue']
])
addGimmick('obj_pictured_gimmick', [
  ['c_flash'],
  ['c_shader'],
  ['uialpha'],
  ['scorealph'],
  ['bgalph'],
  ['noteoverlayalp'],
  ['holdoverlayalpha'],
  ['1_pinkbg_vis'],
  ['1_speech'],
  ['1_glitch'],
  ['2_boost'],
  ['2_dialbox_size'],
  ['2_dialbox_circles'],
  ['2_bg_pics'],
  ['2_dialbox_pulsar'],
  ['2_dialbox_speech'],
  ['2_bg_pinkbg_vis'],
  ['3_pinkbg_alph'],
  ['3_noteblack'],
  ['4_plusbg_vis'],
  ['4_plusbg_pulse'],
  ['4_square_alph'],
  ['4_square_rotspd'],
  ['4_square_scale'],
  ['5_video_toggle'],
  ['5_video_alph'],
  ['5_bord_alph'],
  ['5_abber'],
  ['6_glitch'],
  ['6_video_toggle'],
  ['6_video_alph'],
  ['6_red_layer_alph'],
  ['6_static_alph'],
  ['7_bg_vis'],
  ['7_note_vfx'],
  ['7_static_alph']
])
addGimmick('obj_plaudite_gimmick', [
  ['glitchamp'],
  ['uialpha'],
  ['scorealph'],
  ['bgalph'],
  ['noteoverlayalp'],
  ['sg_endblip'],
  ['supernova_dialogue'],
  ['supernova_cg_xscale'],
  ['supernova_cg_alpha'],
  ['glitchoffset'],
  ['uhnoise'],
  ['abberationxamp'],
  ['abberationyamp'],
  ['fish'],
  ['static'],
  ['supernova_cg_frame'],
  ['sg_endblip_destroy'],
  ['sn_bg_alpha'],
  ['sn_bg_fxamp'],
  ['sn_bg_animspd'],
  ['setup_co'],
  ['setup_co_sect4'],
  ['setup_co_sect6'],
  ['setup_co_sect8'],
  ['setup_co_sect12'],
  ['setup_co_sect14'],
  ['setup_co_end'],
  ['plaudite_jacket'],
  ['plaudite_sect2bg'],
  ['plaudite_sect5bg'],
  ['plaudite_sect7bg'],
  ['unraveling_sidething'],
  ['astellion_sidething'],
  ['astellion_particles'],
  ['supernova_bg_visible'],
  ['libertia_bg_visible'],
  ['stopmotion_bg_visible'],
  ['convergence_bg_visible'],
  ['plaudite_finaldropbg'],
  ['plaudite_finaldropwhitebg'],
  ['plaudite_slash_saturday'],
  ['plaudite_slash_dawn'],
  ['plaudite_ending_event'],
  ['plaudite_red_particle'],
  ['plaudite_pburst'],
  ['plaudite_disable_jacket'],
  ['plaudite_slash_neutral'],
  ['plaudite_finaldropbg2'],
  ['holdoverlayalpha'],
  ['setup_co_sect1'],
  ['hide_combo']
])
addGimmick('obj_ram_gimmick', [
  ['glitchamp'],
  ['glitchoffset'],
  ['fish'],
  ['vig'],
  ['bloom'],
  ['gray'],
  ['posx'],
  ['posy'],
  ['cover1'],
  ['cover2'],
  ['cover3'],
  ['twx1'],
  ['twy1'],
  ['twa1'],
  ['twr1'],
  ['twx2'],
  ['twy2'],
  ['twa2'],
  ['twr2'],
  ['twx3'],
  ['twy3'],
  ['twa3'],
  ['twr3'],
  ['twx4'],
  ['twy4'],
  ['twa4'],
  ['twr4'],
  ['sina'],
  ['sinp'],
  ['sino'],
  ['cosa'],
  ['cosp'],
  ['coso'],
  ['tana'],
  ['tanp'],
  ['tano'],
  ['static'],
  ['uialpha'],
  ['spinradiusx'],
  ['spinradiusz'],
  ['fakezy'],
  ['fakezyb'],
  ['float'],
  ['wiggly'],
  ['imgx1'],
  ['imgy1'],
  ['imgzm1'],
  ['imgzmb1'],
  ['imgzmx1'],
  ['imgzmy1'],
  ['imgrz1'],
  ['imga1'],
  ['imgx2'],
  ['imgy2'],
  ['imgzm2'],
  ['imgzmb2'],
  ['imgzmx2'],
  ['imgzmy2'],
  ['imgrz2'],
  ['imga2'],
  ['imgx3'],
  ['imgy3'],
  ['imgzm3'],
  ['imgzmb3'],
  ['imgzmx3'],
  ['imgzmy3'],
  ['imgrz3'],
  ['imga3'],
  ['imgx4'],
  ['imgy4'],
  ['imgzm4'],
  ['imgzmb4'],
  ['imgzmx4'],
  ['imgzmy4'],
  ['imgrz4'],
  ['imga4'],
  ['imgx5'],
  ['imgy5'],
  ['imgzm5'],
  ['imgzmb5'],
  ['imgzmx5'],
  ['imgzmy5'],
  ['imgrz5'],
  ['imga5'],
  ['imgx6'],
  ['imgy6'],
  ['imgzm6'],
  ['imgzmb6'],
  ['imgzmx6'],
  ['imgzmy6'],
  ['imgrz6'],
  ['imga6'],
  ['imgx7'],
  ['imgy7'],
  ['imgzm7'],
  ['imgzmb7'],
  ['imgzmx7'],
  ['imgzmy7'],
  ['imgrz7'],
  ['imga7'],
  ['planea'],
  ['rotdir'],
  ['texta']
])
addGimmick('obj_scarletdeath_gimmick', [
  ['uialpha'],
  ['cover1'],
  ['cover2'],
  ['cover3'],
  ['wflash'],
  ['rainbow'],
  ['sides'],
  ['notealp'],
  ['video'],
  ['noteoverlayalp'],
  ['shadermode'],
  ['scorealph'],
  ['bgalph'],
  ['gray'],
  ['barrel'],
  ['barrel2'],
  ['hdistort'],
  ['fish'],
  ['vig'],
  ['abx'],
  ['aby'],
  ['aberamp'],
  ['glitchamp'],
  ['glitchoffset'],
  ['uhnoise'],
  ['abberationxamp'],
  ['abberationyamp'],
  ['fish'],
  ['static'],
  ['fx_hue_hue'],
  ['fx_hue_saturation'],
  ['fx_edge'],
  ['fx_posterize'],
  ['fx_twirl'],
  ['fx_posterize_vis'],
  ['fx_underwater'],
  ['bloom'],
  ['angelstar_checker_alpha'],
  ['angelstar_checker_set'],
  ['fx_zoom'],
  ['fx_red'],
  ['heartattack1'],
  ['heartattack2'],
  ['heartattack3'],
  ['heartattack4'],
  ['heartattack5'],
  ['heartattack6']
])
addGimmick('obj_sekaisen_gimmick', [
  ['gray'],
  ['barrel'],
  ['barrel2'],
  ['hdistort'],
  ['fish'],
  ['vig'],
  ['abx'],
  ['aby'],
  ['aberamp'],
  ['uialpha'],
  ['cover1'],
  ['cover2'],
  ['cover3'],
  ['wflash'],
  ['rainbow'],
  ['sides'],
  ['notealp'],
  ['video'],
  ['noteoverlayalp'],
  ['starspawner_timer'],
  ['starspd_low'],
  ['starspd_high'],
  ['starspd_multiplier'],
  ['sekaisen_jacket'],
  ['sekaisen_arrow_point'],
  ['sekaisen_target_point'],
  ['track_alpha'],
  ['en_whiteoverlay'],
  ['eo_endsat1'],
  ['eo_endsat2'],
  ['eo_endsat3'],
  ['eo_endsat4'],
  ['eo_endcg'],
  ['bgalph'],
  ['hide_combo']
])
addGimmick('obj_self_gimmick', [
  ['glitchamp'],
  ['uialpha'],
  ['scorealph'],
  ['holdoverlayalpha'],
  ['bgalph'],
  ['noteoverlayalp'],
  ['sg_endblip'],
  ['glitchoffset'],
  ['uhnoise'],
  ['abberationxamp'],
  ['abberationyamp'],
  ['fish'],
  ['static'],
  ['sg_endblip_destroy'],
  ['sn_bg_alpha'],
  ['sn_bg_fxamp'],
  ['sn_bg_animspd'],
  ['yoffset'],
  ['scrollind0'],
  ['scrollind1'],
  ['scrollind2'],
  ['scrollind3'],
  ['scrollind4'],
  ['scrollind5'],
  ['scrollind6'],
  ['stopmotionnoteskin'],
  ['storycheck1'],
  ['storycheck2'],
  ['sm_bg_enable'],
  ['sm_bg_fade_alpha'],
  ['temporaryshadercreate'],
  ['temporaryshaderdestroy'],
  ['sm_leftbg_frameset'],
  ['sm_rightbg_frameset'],
  ['sm_pushcommand'],
  ['sm_killcommand'],
  ['sm_bar_show'],
  ['sm_bar_progress'],
  ['sm_cyclecount'],
  ['self_satcolor'],
  ['self_satalpha'],
  ['self_satframe'],
  ['self_tsukicolor'],
  ['self_tsukialpha'],
  ['self_tsukiframe'],
  ['self_destsg'],
  ['self_gravebg'],
  ['self_gravefg']
])
addGimmick('obj_starcrashers_gimmick', [
  ['gray'],
  ['barrel'],
  ['barrel2'],
  ['hdistort'],
  ['fish'],
  ['vig'],
  ['abx'],
  ['aby'],
  ['aberamp'],
  ['uialpha'],
  ['cover1'],
  ['cover2'],
  ['cover3'],
  ['wflash'],
  ['rainbow'],
  ['sides'],
  ['notealp'],
  ['video'],
  ['noteoverlayalp'],
  ['stargaze_mask_sat_alpha'],
  ['stargaze_mask_tsuki_alpha'],
  ['stargaze_mask_star_alpha'],
  ['starspawner_timer'],
  ['starspd_low'],
  ['starspd_high'],
  ['starspd_multiplier'],
  ['spawn_star_mask'],
  ['intro_gradient_alpha'],
  ['missinglink_bg_alpha'],
  ['turningpoint_bg_alpha'],
  ['frostedmemories_bg_alpha'],
  ['red_bg_alpha'],
  ['black_bg_alpha'],
  ['laser_spawn'],
  ['spawn_centerrect_red'],
  ['spawn_centerrect_black'],
  ['lasthours_checker_alpha'],
  ['lasthours_checker_chance'],
  ['lasthours_checker_set'],
  ['terminaljourney_bg_alpha'],
  ['star_set_random_alpha'],
  ['buildup_cutin_alpha'],
  ['buildup_cutin_frame'],
  ['chorus_town_alpha'],
  ['chorus_backgroundchecker_alpha'],
  ['chorus_firework'],
  ['chorus_satalli_alpha'],
  ['chorus_greenleft_overlay'],
  ['chorus_satalli_bg_alpha'],
  ['chorus_satalli_alli_particles'],
  ['chorus_satalli_sat_particles'],
  ['end_libertia_bg_alpha'],
  ['whitefade_alpha'],
  ['end_gravescene1_alpha'],
  ['blackfade_alpha'],
  ['end_gravescene2_alpha'],
  ['ending_coroutine']
])
addGimmick('obj_stargazers_gimmick', [
  ['gray'],
  ['barrel'],
  ['barrel2'],
  ['hdistort'],
  ['fish'],
  ['vig'],
  ['abx'],
  ['aby'],
  ['aberamp'],
  ['uialpha'],
  ['cover1'],
  ['cover2'],
  ['cover3'],
  ['wflash'],
  ['rainbow'],
  ['sides'],
  ['notealp'],
  ['video'],
  ['noteoverlayalp'],
  ['bgalph'],
  ['holdoverlayalpha'],
  ['scorealph'],
  ['sg_lanelines0'],
  ['sg_lanelines1'],
  ['sg_lanelines2'],
  ['sg_judgeline'],
  ['sg_starspawner'],
  ['starspd_low'],
  ['starspd_high'],
  ['star_pause'],
  ['starspawn'],
  ['sg_endblip'],
  ['sg_bg_alpha'],
  ['sg_bg_speed']
])
addGimmick('obj_stopmotion_gimmick', [
  ['glitchamp'],
  ['uialpha'],
  ['scorealph'],
  ['holdoverlayalpha'],
  ['bgalph'],
  ['noteoverlayalp'],
  ['sg_endblip'],
  ['glitchoffset'],
  ['uhnoise'],
  ['abberationxamp'],
  ['abberationyamp'],
  ['fish'],
  ['static'],
  ['sg_endblip_destroy'],
  ['sn_bg_alpha'],
  ['sn_bg_fxamp'],
  ['sn_bg_animspd'],
  ['yoffset'],
  ['scrollind0'],
  ['scrollind1'],
  ['scrollind2'],
  ['scrollind3'],
  ['scrollind4'],
  ['scrollind5'],
  ['scrollind6'],
  ['stopmotionnoteskin'],
  ['storycheck1'],
  ['storycheck2'],
  ['sm_bg_enable'],
  ['sm_bg_fade_alpha'],
  ['temporaryshadercreate'],
  ['temporaryshaderdestroy'],
  ['sm_leftbg_frameset'],
  ['sm_rightbg_frameset'],
  ['sm_pushcommand'],
  ['sm_killcommand'],
  ['sm_bar_show'],
  ['sm_bar_progress'],
  ['sm_cyclecount']
])
addGimmick('obj_supernova_gimmick', [
  ['glitchamp'],
  ['uialpha'],
  ['scorealph'],
  ['bgalph'],
  ['noteoverlayalp'],
  ['sg_endblip'],
  ['supernova_dialogue'],
  ['supernova_cg_xscale'],
  ['supernova_cg_alpha'],
  ['glitchoffset'],
  ['uhnoise'],
  ['abberationxamp'],
  ['abberationyamp'],
  ['fish'],
  ['static'],
  ['supernova_cg_frame'],
  ['sg_endblip_destroy'],
  ['sn_bg_alpha'],
  ['sn_bg_fxamp'],
  ['sn_bg_animspd'],
  ['setup_co']
])
addGimmick('obj_times_gimmick', [
  ['glitchamp'],
  ['static'],
  ['wflash'],
  ['tx'],
  ['tx2'],
  ['tx3'],
  ['txj'],
  ['ty'],
  ['ty2'],
  ['ty3'],
  ['tyj'],
  ['trz'],
  ['trz2'],
  ['tz'],
  ['tzx'],
  ['tzy'],
  ['tspl'],
  ['sepx'],
  ['sepy'],
  ['spinang'],
  ['spinrad'],
  ['siny'],
  ['vib'],
  ['hid1'],
  ['hid2'],
  ['hid3'],
  ['hid4'],
  ['hid5']
])
addGimmick('obj_tutorial_gimmick', [
  ['glitchamp'],
  ['uialpha'],
  ['cover1'],
  ['scorealph'],
  ['bgalph'],
  ['noteoverlayalp'],
  ['sg_endblip'],
  ['glitchoffset'],
  ['uhnoise'],
  ['abberationxamp'],
  ['abberationyamp'],
  ['fish'],
  ['static'],
  ['sg_endblip_destroy'],
  ['sn_bg_alpha'],
  ['sn_bg_fxamp'],
  ['sn_bg_animspd'],
  ['yoffset'],
  ['tutorialX'],
  ['tutorialA'],
  ['tutorialIndex']
])
addGimmick('obj_unraveling_gimmick', [
  ['gray'],
  ['barrel'],
  ['barrel2'],
  ['hdistort'],
  ['fish'],
  ['vig'],
  ['abx'],
  ['aby'],
  ['aberamp'],
  ['uialpha'],
  ['cover1'],
  ['cover2'],
  ['cover3'],
  ['wflash'],
  ['rainbow'],
  ['sides'],
  ['notealp'],
  ['video'],
  ['noteoverlayalp']
])

function getModByteFromName(name: string, oname: string): number {
  let mods = globalMods

  if (name in mods) return mods[name]

  let obj = gimmicks[oname]

  if (obj) {
    return obj.extraMods[name]
  }

  console.error(`Unknown mod ${name}`)
  return globalMods.unknown
}

function getModNameFromByte(b: number, name: string) {
  let mods = globalMods

  if ((b & 128) == 128) {
    let obj = gimmicks[name]
    if (obj) {
      mods = obj.extraMods
    }
  }

  let mod = Object.keys(mods)[Object.values(mods).indexOf(b)]
  if (mod) {
    return mod
  }

  throw new Error(`Unknown mod ${b}`)
}

const buffer_u8 = 1
const buffer_s8 = 2
const buffer_u16 = 3
const buffer_s16 = 4
const buffer_u32 = 5
const buffer_s32 = 6
const buffer_f16 = 7
const buffer_f32 = 8
const buffer_f64 = 9
const buffer_bool = 10
const buffer_string = 11
const buffer_u64 = 12
const buffer_text = 13

const NoteDataFlag = {
  END: 161,
  TYPE: 162,
  LANE: 163,
  TIME: 164,
  EXTRA: 166,
  EXTRA_END: 167
}

const ChartDataFlag = {
  NOTE: 160,
  NOTES: 192,
  NOTES_END: 193,
  MODS: 224,
  MODS_END: 225,
  GIMMICK: 226,
  GIMMICK_END: 227,
  MOD_PROXIES: 228,
  MOD_OBJ: 229,
  MOD: 233,
  PERFRAME: 236,
  END: 255
}

// why??
function typeToBufferType(t) {
  switch (t) {
    case 3:
    case 6:
    case 176:
      return buffer_u8
    case 177:
      return buffer_s8
    case 178:
      return buffer_u32
    case 179:
      return buffer_s32
    case 181:
      return buffer_f16
    case 1:
    case 2:
    case 4:
    case 5:
    case 182:
      return buffer_f32
    case 183:
      return buffer_bool
    case 184:
      return buffer_string
    case 7:
      return buffer_s8
  }
  throw new Error('Unknown Type')
}

let easeBytes = {
  linear: 1,
  outElastic: 2,
  inExpo: 3,
  outExpo: 4,
  inOutExpo: 5,
  inQuad: 6,
  outQuad: 7,
  inOutQuad: 8,
  inCubic: 9,
  outCubic: 10,
  inOutCubic: 11,
  outBack: 12,
  inSine: 13,
  outSine: 14,
  inOutSine: 15,
  outQuart: 16,
  inOutCirc: 17,
  inCirc: 18,
  outCirc: 19
}

function getEaseFromByte(b) {
  return Object.keys(easeBytes)[Object.values(easeBytes).indexOf(b)]
}

function getByteFromEase(e) {
  return easeBytes[e]
}

function readNote(buffer: VSChartBuffer): vsbNote {
  let note = { time: 0, lane: 0, type: 0, extra: {} }

  while (true) {
    let flag = buffer.read(buffer_u8)
    switch (flag) {
      case NoteDataFlag.TYPE:
        note.type = buffer.read(buffer_u8) as number
        break
      case NoteDataFlag.LANE:
        note.lane = buffer.read(buffer_u8) as number
        break
      case NoteDataFlag.TIME:
        note.time = buffer.read(buffer_f32) as number
        break
      case NoteDataFlag.EXTRA:
        while (true) {
          let t = buffer.read(buffer_u8)
          if (t == NoteDataFlag.EXTRA_END) break

          let id = buffer.read(buffer_u8) as number
          note.extra[id] = buffer.read(typeToBufferType(t))
        }
        break
    }
    if (flag == NoteDataFlag.END) break
  }
  return note
}

class VSChartBuffer {
  buffer: Uint8Array
  view: DataView
  pointer: number
  /**
   * @param {Uint8Array} buffer
   */
  constructor(buffer) {
    this.buffer = buffer
    this.view = new DataView(buffer.buffer)
    this.pointer = 0
  }

  read(t: number) {
    switch (t) {
      case buffer_u8:
        return this.view.getUint8(this.pointer++)
      case buffer_s8:
        return this.view.getInt8(this.pointer++)
      case buffer_u16: {
        let v = this.view.getUint16(this.pointer, true)
        this.pointer += 2
        return v
      }
      case buffer_s16: {
        let v = this.view.getInt16(this.pointer, true)
        this.pointer += 2
        return v
      }
      case buffer_u32: {
        let v = this.view.getUint32(this.pointer, true)
        this.pointer += 4
        return v
      }
      case buffer_s32: {
        let v = this.view.getInt32(this.pointer, true)
        this.pointer += 4
        return v
      }
      case buffer_f16:
        throw new Error('16-bit floating point numbers are not currently supported')
      case buffer_f32: {
        let v = this.view.getFloat32(this.pointer, true)
        this.pointer += 4
        return v
      }
      case buffer_f64: {
        let v = this.view.getFloat64(this.pointer, true)
        this.pointer += 4
        return v
      }
      case buffer_bool:
        return this.view.getUint8(this.pointer++) != 0
      case buffer_u64:
        throw new Error('64-bit unsigned integers are not currently supported')
      case buffer_string:
        let s = ''
        while (true) {
          let v = this.view.getUint8(this.pointer++)
          if (v == 0) break
          s += String.fromCharCode(v)
        }
        return s
      case buffer_text:
        throw new Error('Text cannot be read')
      default:
        throw new Error('Cannot read data type ' + t)
    }
  }
}

export function putFloat32(buf, v) {
  let view = new DataView(new ArrayBuffer(4))
  view.setFloat32(0, v, true)
  buf.push(view.getUint8(0))
  buf.push(view.getUint8(1))
  buf.push(view.getUint8(2))
  buf.push(view.getUint8(3))
}

export function putUint32(buf, v) {
  let view = new DataView(new ArrayBuffer(4))
  view.setUint32(0, v, true)
  buf.push(view.getUint8(0))
  buf.push(view.getUint8(1))
  buf.push(view.getUint8(2))
  buf.push(view.getUint8(3))
}

/**
 * @param {Array} buf
 * @param {string} v
 */
export function putString(buf, v) {
  for (let i = 0; i < v.length; i++) {
    buf.push(v.charCodeAt(i))
  }
  buf.push(0)
}

export function beatToTime(bpmList, beat) {
  let l = 0
  let r = bpmList.length - 1
  while (l < r) {
    let mid = Math.floor((l + r + 1) / 2)
    if (beat < bpmList[mid].start_beat) r = mid - 1
    else l = mid
  }
  return bpmList[l].start_time / 1000 + ((beat - bpmList[l].start_beat) / bpmList[l].bpm) * 60
}

export function timeToBeat(bpmList, time) {
  let l = 0
  let r = bpmList.length - 1
  while (l < r) {
    let mid = Math.floor((l + r + 1) / 2)
    if (time < bpmList[mid].start_time / 1000) r = mid - 1
    else l = mid
  }
  return bpmList[l].start_beat + ((time - bpmList[l].start_time / 1000) * bpmList[l].bpm) / 60
}

export class VSChart {
  name: string
  isValid: boolean
  notes: vsbNote[]
  mods: undefined | vsbModData
  ce_bpmChanges: vsbNote[]
  ce_initialBpm: number

  constructor(buffer: Uint8Array, name: string) {
    this.name = name
    this.isValid = true
    this.notes = []
    this.mods = undefined

    this.ce_bpmChanges = []
    this.ce_initialBpm = 120

    if (buffer) {
      let vbuf = new VSChartBuffer(buffer)

      this.isValid = false
      // @ts-expect-error
      let header = String.fromCharCode(vbuf.read(1), vbuf.read(1), vbuf.read(1))
      if (header != 'VSC') return

      vbuf.read(buffer_u8)
      vbuf.read(buffer_u8)

      while (true) {
        let flag = vbuf.read(buffer_u8)

        if (flag == ChartDataFlag.NOTES) {
          while (true) {
            let flag2 = vbuf.read(buffer_u8)
            if (flag2 == ChartDataFlag.NOTE) {
              let note = readNote(vbuf)
              this.notes.push(note)
              if (note.type == 3) {
                this.ce_bpmChanges.push(note)
              }
            } else if (flag2 == ChartDataFlag.NOTES_END) break
          }
        }
        if (flag == ChartDataFlag.MODS) {
          let data = {
            proxies: 1,
            obj: 'obj_base_gimmick'
          }
          let modlist: vsbMod[] = []
          let perframelist: vsbPerframe[] = []

          while (true) {
            let flag2 = vbuf.read(buffer_u8)
            switch (flag2) {
              case ChartDataFlag.MOD_PROXIES:
                data.proxies = vbuf.read(buffer_u8) as number
                break
              case ChartDataFlag.MOD_OBJ:
                data.obj = vbuf.read(buffer_string) as string
                break
            }
            if (flag2 == ChartDataFlag.GIMMICK) {
              while (true) {
                let flag3 = vbuf.read(buffer_u8)

                if (flag3 == ChartDataFlag.MOD) {
                  let mod = {
                    b: 0,
                    d: 0,
                    e: 'linear',
                    v1: 0,
                    v2: 0,
                    mi: 0,
                    p: 0,
                    m: '',
                    w: 0
                  }

                  mod.b = vbuf.read(buffer_f32) as number
                  mod.d = vbuf.read(buffer_f32) as number
                  mod.e = getEaseFromByte(vbuf.read(buffer_u8) as number)
                  mod.v1 = vbuf.read(buffer_f32) as number
                  mod.v2 = vbuf.read(buffer_f32) as number
                  mod.mi = vbuf.read(buffer_u8) as number
                  mod.p = vbuf.read(buffer_s8) as number
                  mod.m = getModNameFromByte(mod.mi, data.obj)
                  mod.w = modWeight[mod.m]

                  modlist.push(mod)
                } else if (flag3 == ChartDataFlag.PERFRAME) {
                  let mod = {
                    b: 0,
                    e: 0,
                    f: ''
                  }

                  mod.b = vbuf.read(buffer_f32) as number
                  mod.e = vbuf.read(buffer_f32) as number
                  mod.f = vbuf.read(buffer_string) as string

                  perframelist.push(mod)
                }

                if (flag3 == ChartDataFlag.GIMMICK_END) break
              }

              this.mods = {
                mods: modlist,
                perFrame: perframelist,
                data: data
              }
            }
            if (flag2 == ChartDataFlag.MODS_END) break
          }
        }
        if (flag == ChartDataFlag.END) break
      }

      this.ce_initialBpm = (this.ce_bpmChanges[0] ?? { extra: {} }).extra[1] ?? 120
      this.isValid = true
      if (this.mods) this.mods.mods.sort((a, b) => a.b - b.b)
      this.updateBpmChangeTimes()
      this.updateModTimes()
    }
  }

  updateBpmChangeTimes() {
    let bpm = this.ce_initialBpm
    let lastBpmChangeTime = 0
    let lastBpmChangeBeats = 0
    for (let change of this.ce_bpmChanges) {
      let newBpm = change.extra[1] ?? bpm
      if (newBpm != undefined) {
        let oldBeatDuration = 60000 / bpm
        let beatsSinceChange = (change.time - lastBpmChangeTime) / oldBeatDuration
        let totalBeats = beatsSinceChange + lastBpmChangeBeats
        // @ts-ignore
        change.start_time = change.time
        // @ts-ignore
        change.start_beat = totalBeats
        // @ts-ignore
        change.bpm = newBpm
        bpm = newBpm
        lastBpmChangeBeats = totalBeats
        lastBpmChangeTime = change.time
      }
    }
  }

  updateModTimes() {
    if (!this.mods) return
    for (let mod of this.mods.mods) {
      // @ts-ignore
      mod.time = beatToTime(this.ce_bpmChanges, mod.b)
    }
  }

  toBytes() {
    let bytes = [0x56, 0x53, 0x43, 0x01, 0x00]

    bytes.push(ChartDataFlag.NOTES)
    for (let note of this.notes) {
      bytes.push(ChartDataFlag.NOTE)
      bytes.push(NoteDataFlag.TYPE)
      bytes.push(note.type)
      bytes.push(NoteDataFlag.LANE)
      bytes.push(note.lane)
      bytes.push(NoteDataFlag.TIME)
      putFloat32(bytes, note.time)

      if ((note.type == 3 || note.type == 2) && note.extra[1] != undefined) {
        bytes.push(NoteDataFlag.EXTRA)
        bytes.push(182)
        bytes.push(1)
        putFloat32(bytes, note.extra[1])
        bytes.push(NoteDataFlag.EXTRA_END)
      }
      bytes.push(NoteDataFlag.END)
    }
    bytes.push(ChartDataFlag.NOTES_END)

    if (this.mods) {
      bytes.push(ChartDataFlag.MODS)
      bytes.push(ChartDataFlag.MOD_PROXIES)
      bytes.push(this.mods.data.proxies)
      bytes.push(ChartDataFlag.MOD_OBJ)
      putString(bytes, this.mods.data.obj)
      bytes.push(ChartDataFlag.GIMMICK)
      for (let mod of this.mods.mods) {
        bytes.push(ChartDataFlag.MOD)
        putFloat32(bytes, mod.b)
        putFloat32(bytes, mod.d)
        bytes.push(getByteFromEase(mod.e))
        putFloat32(bytes, mod.v1)
        putFloat32(bytes, mod.v2)
        bytes.push(mod.mi)
        bytes.push((mod.p + 256) % 256)
      }
      for (let mod of this.mods.perFrame) {
        bytes.push(ChartDataFlag.PERFRAME)
        putFloat32(bytes, mod.b)
        putFloat32(bytes, mod.e)
        putString(bytes, mod.f)
      }
      bytes.push(ChartDataFlag.GIMMICK_END)
      bytes.push(ChartDataFlag.MODS_END)
    }

    bytes.push(ChartDataFlag.END)

    return bytes
  }
}

export function parse_vsm(vsm: string): vsbModData {
  const d = {
    data: {
      proxies: 1,
      obj: 'obj_base_gimmick'
    },
    mods: [] as vsbMod[],
    perFrame: [] as vsbPerframe[],
    count_no_loop: 0,
    count_loop: 0
  }

  let mode: 'mods' | 'mpf' = 'mods'

  for (let line of vsm.split('\n')) {
    line = line.trim()
    if (line.length == 0) continue

    if (line == 'mpf') {
      mode = 'mpf'
      continue
    }

    if (line.startsWith('!')) {
      const parts = line.substring(1).split(':')
      if (parts.length >= 2) {
        const key = parts[0].trim()
        const value = parts.slice(1).join(':').trim()
        d.data[key] = value
      }
      continue
    }

    const parts = line.split(',')

    if (mode == 'mods') {
      const dur = parts[1]
      const ease = parts[2]
      let from = parts[3]
      let to = parts[4]
      const modName = parts[5]
      const proxy = parts[6]

      d.count_no_loop++

      const beatParts = parts[0].split(':')
      const beatStart = parseFloat(beatParts[0])
      let beatEnd = beatStart
      let beatInc = 1

      if (beatParts.length > 1) beatEnd = parseFloat(beatParts[1])

      if (beatParts.length > 2) beatInc = parseFloat(beatParts[2])

      if (from == '_') from = '573613'

      if (to == '_') to = '573613'

      for (let i = beatStart; i <= beatEnd; i += beatInc) {
        d.count_loop++
        const m: vsbMod = {
          b: i,
          d: parseFloat(dur),
          v1: parseFloat(from),
          v2: parseFloat(to),
          m: modName,
          p: parseFloat(proxy),
          w: modWeight[modName] ?? 1,
          e: easeBytes[ease] ? getEaseFromByte(easeBytes[ease]) : 'linear',
          mi: getModByteFromName(modName, d.data.obj)
        }
        d.mods.push(m)
      }
    } else if (mode == 'mpf') {
      const m: vsbPerframe = {
        b: parseFloat(parts[0]),
        e: parseFloat(parts[1]),
        f: parts[2]
      }
      d.perFrame.push(m)
    }
  }

  return d
}

export function to_vsb_data(diff: ChartTypeV2.diff, vsm: string) {
  const parsedVsm = parse_vsm(vsm)

  const chart = new VSChart(null as any, '')

  const bpmList = diff.timing.map((t, _) => ({
    start_time: t.time * 1000,
    start_beat: 0,
    bpm: t.bpm,
    num: t.num,
    den: t.den
  }))

  for (let i = 1; i < bpmList.length; i++) {
    const prev = bpmList[i - 1]
    const curr = bpmList[i]
    const beatDiff = (curr.start_time / 1000 - prev.start_time / 1000) * (prev.bpm / 60)
    curr.start_beat = prev.start_beat + beatDiff
  }

  chart.ce_bpmChanges = bpmList.map((t, index) => {
    if (index === 0) {
      chart.ce_initialBpm = t.bpm
    }
    return {
      time: t.start_time / 1000,
      lane: 0,
      type: 3,
      extra: { 1: t.bpm }
    } as vsbNote
  })

  chart.notes = diff.notes.map((note) => {
    const isHold = 'len' in note
    return {
      time: note.time,
      lane: note.lane,
      type: isHold ? 2 : 0,
      extra: isHold ? { 2: note.len } : {}
    } as vsbNote
  })

  if (parsedVsm) {
    chart.mods = {
      data: parsedVsm.data,
      mods: parsedVsm.mods,
      perFrame: parsedVsm.perFrame
    }
  }

  chart.updateBpmChangeTimes()
  chart.updateModTimes()

  return chart.toBytes()
}
