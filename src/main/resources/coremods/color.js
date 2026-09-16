var Opcodes=Java.type('org.objectweb.asm.Opcodes');
var Type=Java.type('org.objectweb.asm.Type');
var InsnNode=Java.type('org.objectweb.asm.tree.InsnNode');
var VarInsnNode=Java.type('org.objectweb.asm.tree.VarInsnNode');
var TypeInsnNode=Java.type('org.objectweb.asm.tree.TypeInsnNode');
var FieldInsnNode=Java.type('org.objectweb.asm.tree.FieldInsnNode');
var MethodInsnNode=Java.type('org.objectweb.asm.tree.MethodInsnNode');
var LabelNode=Java.type('org.objectweb.asm.tree.LabelNode');
var JumpInsnNode=Java.type('org.objectweb.asm.tree.JumpInsnNode');
var LdcInsnNode=Java.type('org.objectweb.asm.tree.LdcInsnNode');
var FieldNode=Java.type('org.objectweb.asm.tree.FieldNode');
var MethodNode=Java.type('org.objectweb.asm.tree.MethodNode');
var InsnList=Java.type('org.objectweb.asm.tree.InsnList');

function fm(c,n,d){for(var i=0;i<c.methods.size();i++){var m=c.methods.get(i);if(String(m.name)===n&&String(m.desc)===d)return m;}return null;}
function hasField(c,n){for(var i=0;i<c.fields.size();i++){if(String(c.fields.get(i).name)===n)return true;}return false;}
function hasMethod(c,n,d){return fm(c,n,d)!=null;}

function prependCadOverride(m, stackVar){
  var p=new InsnList();
  var cont=new LabelNode();
  p.add(new VarInsnNode(Opcodes.ALOAD,stackVar));
  p.add(new MethodInsnNode(Opcodes.INVOKESTATIC,'dev/mellowb/psieightfold/spell/util/ReflectOps','getStackColorOverride','(Ljava/lang/Object;)Ljava/lang/Integer;',false));
  p.add(new InsnNode(Opcodes.DUP));
  p.add(new JumpInsnNode(Opcodes.IFNULL,cont));
  p.add(new MethodInsnNode(Opcodes.INVOKEVIRTUAL,'java/lang/Integer','intValue','()I',false));
  // Item/CAD tinting expects opaque ARGB.
  p.add(new LdcInsnNode(-16777216));
  p.add(new InsnNode(Opcodes.IOR));
  p.add(new InsnNode(Opcodes.IRETURN));
  p.add(cont);
  p.add(new InsnNode(Opcodes.POP));
  m.instructions.insert(p);
}

function addCircleColorMethods(c){
  if(!hasMethod(c,'eightfoldSetColor','(I)V')){
    var s=new MethodNode(Opcodes.ACC_PUBLIC,'eightfoldSetColor','(I)V',null,null);
    s.instructions.add(new VarInsnNode(Opcodes.ALOAD,0));
    s.instructions.add(new MethodInsnNode(Opcodes.INVOKEVIRTUAL,'vazkii/psi/common/entity/EntitySpellCircle','getEntityData','()Lnet/minecraft/network/syncher/SynchedEntityData;',false));
    s.instructions.add(new FieldInsnNode(Opcodes.GETSTATIC,'vazkii/psi/common/entity/EntitySpellCircle','EIGHTFOLD_COLOR','Lnet/minecraft/network/syncher/EntityDataAccessor;'));
    s.instructions.add(new VarInsnNode(Opcodes.ILOAD,1));
    s.instructions.add(new MethodInsnNode(Opcodes.INVOKESTATIC,'java/lang/Integer','valueOf','(I)Ljava/lang/Integer;',false));
    s.instructions.add(new MethodInsnNode(Opcodes.INVOKEVIRTUAL,'net/minecraft/network/syncher/SynchedEntityData','set','(Lnet/minecraft/network/syncher/EntityDataAccessor;Ljava/lang/Object;)V',false));
    s.instructions.add(new InsnNode(Opcodes.RETURN));
    s.maxStack=3;s.maxLocals=2;
    c.methods.add(s);
  }
  if(!hasMethod(c,'eightfoldGetColor','()I')){
    var g=new MethodNode(Opcodes.ACC_PUBLIC,'eightfoldGetColor','()I',null,null);
    g.instructions.add(new VarInsnNode(Opcodes.ALOAD,0));
    g.instructions.add(new MethodInsnNode(Opcodes.INVOKEVIRTUAL,'vazkii/psi/common/entity/EntitySpellCircle','getEntityData','()Lnet/minecraft/network/syncher/SynchedEntityData;',false));
    g.instructions.add(new FieldInsnNode(Opcodes.GETSTATIC,'vazkii/psi/common/entity/EntitySpellCircle','EIGHTFOLD_COLOR','Lnet/minecraft/network/syncher/EntityDataAccessor;'));
    g.instructions.add(new MethodInsnNode(Opcodes.INVOKEVIRTUAL,'net/minecraft/network/syncher/SynchedEntityData','get','(Lnet/minecraft/network/syncher/EntityDataAccessor;)Ljava/lang/Object;',false));
    g.instructions.add(new TypeInsnNode(Opcodes.CHECKCAST,'java/lang/Integer'));
    g.instructions.add(new MethodInsnNode(Opcodes.INVOKEVIRTUAL,'java/lang/Integer','intValue','()I',false));
    g.instructions.add(new InsnNode(Opcodes.IRETURN));
    g.maxStack=2;g.maxLocals=1;
    c.methods.add(g);
  }
}

function initializeCoreMod(){
  return {
    // CAD/UI path only. Keep this separate from circle rendering.
    'eightfold_cad_color_override':{
      target:{type:'CLASS',name:'vazkii.psi.common.item.ItemCAD'},
      transformer:function(c){
        var m=fm(c,'getSpellColor','(Lnet/minecraft/world/item/ItemStack;)I');
        if(m!=null) prependCadOverride(m,1);
        return c;
      }
    },

    // Give every spell-circle entity a real synced RGB field. -1 means "use normal Psi colorizer".
    'eightfold_spell_circle_synced_color':{
      target:{type:'CLASS',name:'vazkii.psi.common.entity.EntitySpellCircle'},
      transformer:function(c){
        if(!hasField(c,'EIGHTFOLD_COLOR')) c.fields.add(new FieldNode(Opcodes.ACC_PUBLIC|Opcodes.ACC_STATIC|Opcodes.ACC_FINAL,'EIGHTFOLD_COLOR','Lnet/minecraft/network/syncher/EntityDataAccessor;',null,null));
        addCircleColorMethods(c);

        var cl=fm(c,'<clinit>','()V');
        if(cl!=null){
          var ret=null;for(var n=cl.instructions.getLast();n!=null;n=n.getPrevious()){if(n.getOpcode()===Opcodes.RETURN){ret=n;break;}}
          if(ret!=null){
            var p=new InsnList();
            p.add(new LdcInsnNode(Type.getType('Lvazkii/psi/common/entity/EntitySpellCircle;')));
            p.add(new FieldInsnNode(Opcodes.GETSTATIC,'net/minecraft/network/syncher/EntityDataSerializers','INT','Lnet/minecraft/network/syncher/EntityDataSerializer;'));
            p.add(new MethodInsnNode(Opcodes.INVOKESTATIC,'net/minecraft/network/syncher/SynchedEntityData','defineId','(Ljava/lang/Class;Lnet/minecraft/network/syncher/EntityDataSerializer;)Lnet/minecraft/network/syncher/EntityDataAccessor;',false));
            p.add(new FieldInsnNode(Opcodes.PUTSTATIC,'vazkii/psi/common/entity/EntitySpellCircle','EIGHTFOLD_COLOR','Lnet/minecraft/network/syncher/EntityDataAccessor;'));
            cl.instructions.insertBefore(ret,p);
          }
        }

        var def=fm(c,'defineSynchedData','(Lnet/minecraft/network/syncher/SynchedEntityData$Builder;)V');
        if(def!=null){
          var ret2=null;for(var n2=def.instructions.getLast();n2!=null;n2=n2.getPrevious()){if(n2.getOpcode()===Opcodes.RETURN){ret2=n2;break;}}
          if(ret2!=null){
            var d=new InsnList();
            d.add(new VarInsnNode(Opcodes.ALOAD,1));
            d.add(new FieldInsnNode(Opcodes.GETSTATIC,'vazkii/psi/common/entity/EntitySpellCircle','EIGHTFOLD_COLOR','Lnet/minecraft/network/syncher/EntityDataAccessor;'));
            d.add(new InsnNode(Opcodes.ICONST_M1));
            d.add(new MethodInsnNode(Opcodes.INVOKESTATIC,'java/lang/Integer','valueOf','(I)Ljava/lang/Integer;',false));
            d.add(new MethodInsnNode(Opcodes.INVOKEVIRTUAL,'net/minecraft/network/syncher/SynchedEntityData$Builder','define','(Lnet/minecraft/network/syncher/EntityDataAccessor;Ljava/lang/Object;)Lnet/minecraft/network/syncher/SynchedEntityData$Builder;',false));
            d.add(new InsnNode(Opcodes.POP));
            def.instructions.insertBefore(ret2,d);
          }
        }

        // Particle color in EntitySpellCircle.tick(): custom RGB if present, otherwise Psi's normal colorizer.
        var tick=fm(c,'tick','()V');
        if(tick!=null){
          for(var t=tick.instructions.getFirst();t!=null;t=t.getNext()){
            if(t instanceof MethodInsnNode && String(t.owner)==='vazkii/psi/api/cad/CADComponentLookup' && String(t.name)==='color'){
              var s=t.getNext();while(s!=null && !(s instanceof VarInsnNode && s.getOpcode()===Opcodes.ISTORE && s.var===4)) s=s.getNext();
              if(s!=null){
                var q=new InsnList();
                q.add(new VarInsnNode(Opcodes.ALOAD,0));
                q.add(new MethodInsnNode(Opcodes.INVOKEVIRTUAL,'vazkii/psi/common/entity/EntitySpellCircle','eightfoldGetColor','()I',false));
                q.add(new VarInsnNode(Opcodes.ILOAD,4));
                q.add(new MethodInsnNode(Opcodes.INVOKESTATIC,'dev/mellowb/psieightfold/spell/util/ColorOps','chooseCircleColor','(II)I',false));
                q.add(new VarInsnNode(Opcodes.ISTORE,4));
                tick.instructions.insert(s,q);
              }
              break;
            }
          }
        }
        return c;
      }
    },

    // Final render path reads the synced integer directly. It stays plain 0xRRGGBB.
    'eightfold_circle_render_color':{
      target:{type:'CLASS',name:'vazkii.psi.client.render.entity.RenderSpellCircle'},
      transformer:function(c){
        var m=fm(c,'render','(Lvazkii/psi/common/entity/EntitySpellCircle;FFLcom/mojang/blaze3d/vertex/PoseStack;Lnet/minecraft/client/renderer/MultiBufferSource;I)V');
        if(m!=null){
          for(var n=m.instructions.getFirst();n!=null;n=n.getNext()){
            if(n instanceof VarInsnNode && n.getOpcode()===Opcodes.ISTORE && n.var===8){
              var q=new InsnList();
              q.add(new VarInsnNode(Opcodes.ALOAD,1));
              q.add(new MethodInsnNode(Opcodes.INVOKEVIRTUAL,'vazkii/psi/common/entity/EntitySpellCircle','eightfoldGetColor','()I',false));
              q.add(new VarInsnNode(Opcodes.ILOAD,8));
              q.add(new MethodInsnNode(Opcodes.INVOKESTATIC,'dev/mellowb/psieightfold/spell/util/ColorOps','chooseCircleColor','(II)I',false));
              q.add(new VarInsnNode(Opcodes.ISTORE,8));
              m.instructions.insert(n,q);
              break;
            }
          }
        }
        return c;
      }
    },

    'eightfold_conjure_circle_color':{
      target:{type:'CLASS',name:'vazkii.psi.common.spell.trick.entity.PieceTrickConjureCircle'},
      transformer:function(c){
        if(!hasField(c,'eightfoldColor')) c.fields.add(new FieldNode(Opcodes.ACC_PRIVATE,'eightfoldColor','Lvazkii/psi/api/spell/SpellParam;',null,null));

        var init=fm(c,'initParams','()V');
        if(init!=null){
          var ret=null;for(var n=init.instructions.getLast();n!=null;n=n.getPrevious()){if(n.getOpcode()===Opcodes.RETURN){ret=n;break;}}
          if(ret!=null){
            var a=new InsnList();
            a.add(new VarInsnNode(Opcodes.ALOAD,0));
            a.add(new VarInsnNode(Opcodes.ALOAD,0));
            a.add(new TypeInsnNode(Opcodes.NEW,'dev/mellowb/psieightfold/spell/param/ParamString'));
            a.add(new InsnNode(Opcodes.DUP));
            a.add(new LdcInsnNode('psieightfold.spellparam.color'));
            a.add(new LdcInsnNode(16733695));
            a.add(new InsnNode(Opcodes.ICONST_1));
            a.add(new InsnNode(Opcodes.ICONST_0));
            a.add(new MethodInsnNode(Opcodes.INVOKESPECIAL,'dev/mellowb/psieightfold/spell/param/ParamString','<init>','(Ljava/lang/String;IZZ)V',false));
            a.add(new InsnNode(Opcodes.DUP_X1));
            a.add(new FieldInsnNode(Opcodes.PUTFIELD,'vazkii/psi/common/spell/trick/entity/PieceTrickConjureCircle','eightfoldColor','Lvazkii/psi/api/spell/SpellParam;'));
            a.add(new MethodInsnNode(Opcodes.INVOKEVIRTUAL,'vazkii/psi/common/spell/trick/entity/PieceTrickConjureCircle','addParam','(Lvazkii/psi/api/spell/SpellParam;)V',false));
            init.instructions.insertBefore(ret,a);
          }
        }

        var ex=fm(c,'execute','(Lvazkii/psi/api/spell/SpellContext;)Ljava/lang/Object;');
        if(ex!=null){
          // local 10 is the newly-created EntitySpellCircle, local 8 is the casting CAD.
          var circleStore=null;
          for(var e=ex.instructions.getFirst();e!=null;e=e.getNext()){
            if(e instanceof VarInsnNode && e.getOpcode()===Opcodes.ASTORE && e.var===10){circleStore=e;break;}
          }
          if(circleStore!=null){
            var p=new InsnList();
            p.add(new VarInsnNode(Opcodes.ALOAD,10));
            p.add(new VarInsnNode(Opcodes.ALOAD,8));
            p.add(new VarInsnNode(Opcodes.ALOAD,0));
            p.add(new VarInsnNode(Opcodes.ALOAD,1));
            p.add(new VarInsnNode(Opcodes.ALOAD,0));
            p.add(new FieldInsnNode(Opcodes.GETFIELD,'vazkii/psi/common/spell/trick/entity/PieceTrickConjureCircle','eightfoldColor','Lvazkii/psi/api/spell/SpellParam;'));
            p.add(new InsnNode(Opcodes.ACONST_NULL));
            p.add(new MethodInsnNode(Opcodes.INVOKEVIRTUAL,'vazkii/psi/common/spell/trick/entity/PieceTrickConjureCircle','getParamValueOrDefault','(Lvazkii/psi/api/spell/SpellContext;Lvazkii/psi/api/spell/SpellParam;Ljava/lang/Object;)Ljava/lang/Object;',false));
            p.add(new TypeInsnNode(Opcodes.CHECKCAST,'java/lang/String'));
            p.add(new MethodInsnNode(Opcodes.INVOKESTATIC,'dev/mellowb/psieightfold/spell/util/ColorOps','resolveCircleColor','(Ljava/lang/Object;Ljava/lang/String;)I',false));
            p.add(new MethodInsnNode(Opcodes.INVOKEVIRTUAL,'vazkii/psi/common/entity/EntitySpellCircle','eightfoldSetColor','(I)V',false));
            ex.instructions.insert(circleStore,p);
          }
        }
        return c;
      }
    }
  };
}
