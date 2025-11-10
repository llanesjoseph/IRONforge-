// build_playbook.js
import { writeFileSync } from "fs";

function point(t,x,y){return {t,x,y};}
function baseOL(){return [
  {pos:"LT",x:-1,y:-2,block:"base"},
  {pos:"LG",x:-1,y:-1,block:"base"},
  {pos:"C",x:-1,y:0,block:"base"},
  {pos:"RG",x:-1,y:1,block:"base"},
  {pos:"RT",x:-1,y:2,block:"base"}
];}

const plays = {
  run: [
    {
      name:"Inside Zone Right",
      concept:"Run",
      formation:"Shotgun 2x2",
      hash:"middle",
      motions:[],
      qb:{path:[point(0,-4,0),point(0.5,-3,0)],handoff_time:0.5},
      run_paths:{
        RB:[point(0,-6,-3),point(0.2,-5,-2),point(0.4,-3,0),point(0.6,0,2),point(0.8,2,3),point(1.0,4,4)]
      },
      offensive_line:baseOL(),
      timing_summary:{snap_to_mesh:0.5,play_length:4.0},
      learning_notes:"RB presses play side and cuts off first down lineman past center."
    },
    {
      name:"Power Right",
      concept:"Run",
      formation:"I-Pro Right",
      hash:"middle",
      motions:[],
      qb:{path:[point(0,-2,0),point(0.5,-1,0)],handoff_time:0.5},
      run_paths:{
        RB:[point(0,-6,0),point(0.3,-4,0),point(0.6,-2,1),point(0.8,0,2),point(1.0,2,3)]
      },
      offensive_line:baseOL(),
      timing_summary:{snap_to_mesh:0.5,play_length:3.8},
      learning_notes:"Backside guard pulls and kicks EMOL; FB wraps through B-gap."
    },
    {
      name:"Jet Sweep Right",
      concept:"Run",
      formation:"Trips Right",
      hash:"right",
      motions:[{who:"SL_Z",type:"fast_jet",start:-0.5,end:0}],
      qb:{path:[point(0,-4,0),point(0.5,-3,0)],handoff_time:0},
      run_paths:{
        SL_Z:[point(-0.5,0,14),point(0,0,7),point(0.4,3,12),point(0.8,6,18),point(1.2,8,24)]
      },
      offensive_line:baseOL(),
      timing_summary:{snap_to_mesh:0,play_length:3.5},
      learning_notes:"Timing snap as motion crosses QB."
    }
  ],
  pass: [
    {
      name:"Slant-Flat 2x2",
      concept:"Pass",
      formation:"Shotgun 2x2",
      hash:"middle",
      motions:[],
      qb:{path:[point(0,-4,0),point(0.3,-5,0)],release_point:point(1.3,-5,0)},
      routes:{
        WR_Z:[point(0,0,22),point(0.2,1,23),point(0.6,3,26),point(1.0,4,28)],
        SL_Z:[point(0,0,10),point(0.4,3,8),point(0.8,7,4)],
        SL_X:[point(0,0,-10),point(0.4,3,-12),point(0.8,7,-15)],
        WR_X:[point(0,0,-22),point(0.2,1,-23),point(0.6,3,-26),point(1.0,4,-28)],
        RB:[point(0,-6,-3),point(0.4,0,3)]
      },
      offensive_line:baseOL(),
      timing_summary:{snap_to_throw:1.3},
      learning_notes:"Read flat defender; ball out in under 1.5 s."
    },
    {
      name:"Four Verticals",
      concept:"Pass",
      formation:"Shotgun 2x2",
      hash:"right",
      qb:{path:[point(0,-4,0),point(0.5,-6,0)],release_point:point(2.2,-6,0)},
      routes:{
        WR_Z:[point(0,0,22),point(2,22,35)],
        SL_Z:[point(0,0,10),point(2,10,35)],
        SL_X:[point(0,0,-10),point(2,-10,35)],
        WR_X:[point(0,0,-22),point(2,-22,35)],
        RB:[point(0,-6,-3),point(0.4,-3,3)]
      },
      offensive_line:baseOL(),
      timing_summary:{snap_to_throw:2.2},
      learning_notes:"Hit seam vs split safeties."
    }
  ],
  play_action: [
    {
      name:"Flood Boot Right",
      concept:"Play-Action",
      formation:"Singleback TE Right",
      hash:"right",
      qb:{path:[point(0,-2,0),point(0.4,0,1),point(0.8,2,2)],release_point:point(2.0,3,2)},
      routes:{
        TE:[point(0,0,7),point(0.8,5,10)],
        WR_Z:[point(0,0,18),point(1.5,10,18)],
        WR_X:[point(0,0,-22),point(1.8,15,5)],
        RB:[point(0,-6,0),point(0.6,-3,-3)]
      },
      offensive_line:baseOL(),
      timing_summary:{snap_to_throw:2.0},
      learning_notes:"Bootleg off outside-zone fake; three-level flood."
    }
  ],
  rpo_and_trick: [
    {
      name:"Bubble RPO",
      concept:"RPO",
      formation:"Trips Right",
      hash:"right",
      read_key:"apex_LB",
      qb:{path:[point(0,-4,0),point(0.5,-3,0)],release_point:point(1.0,-3,0)},
      routes:{
        SL_Z:[point(0,0,14),point(0.4,-1,18)],
        WR_Z:[point(0,0,22),point(0.4,5,24)],
        WR_X:[point(0,0,-22),point(1.0,8,-5)]
      },
      run_paths:{
        RB:[point(0,-6,-3),point(0.4,-2,1)]
      },
      offensive_line:baseOL(),
      timing_summary:{decision_window:1.0},
      learning_notes:"If apex widens, handoff; if he fits, throw bubble."
    },
    {
      name:"Flea Flicker",
      concept:"Trick",
      formation:"Singleback",
      hash:"middle",
      qb:{path:[point(0,-2,0),point(0.4,-1,0),point(1.0,-2,0)],release_point:point(2.0,-2,0)},
      routes:{
        WR_Z:[point(0,0,18),point(2,10,25)],
        WR_X:[point(0,0,-22),point(2,-22,35)],
        TE:[point(0,0,7),point(1.5,12,15)]
      },
      offensive_line:baseOL(),
      timing_summary:{snap_to_throw:2.0},
      learning_notes:"Sell run; RB pitches back; QB launches deep."
    }
  ]
};

writeFileSync("playbook.json",
  JSON.stringify({metadata:{version:"1.0",unit:"yards",created:new Date().toISOString()},plays:plays}, null, 2)
);
console.log("✅  playbook.json generated.");
