var Opcodes=Java.type('org.objectweb.asm.Opcodes');
var InsnNode=Java.type('org.objectweb.asm.tree.InsnNode');
var VarInsnNode=Java.type('org.objectweb.asm.tree.VarInsnNode');
var MethodInsnNode=Java.type('org.objectweb.asm.tree.MethodInsnNode');

function isInjectionMethod(method){
  var lists=[method.visibleAnnotations,method.invisibleAnnotations];
  for(var li=0;li<lists.length;li++){
    var list=lists[li];
    if(list==null) continue;
    for(var i=0;i<list.size();i++){
      var d=String(list.get(i).desc);
      if(d==='Lorg/spongepowered/asm/mixin/injection/Redirect;' ||
         d==='Lorg/spongepowered/asm/mixin/injection/Inject;' ||
         d==='Lorg/spongepowered/asm/mixin/injection/ModifyArg;' ||
         d==='Lorg/spongepowered/asm/mixin/injection/ModifyArgs;' ||
         d==='Lorg/spongepowered/asm/mixin/injection/ModifyVariable;' ||
         d==='Lorg/spongepowered/asm/mixin/injection/ModifyConstant;' ||
         d==='Lcom/llamalad7/mixinextras/injector/wrapoperation/WrapOperation;') return true;
    }
  }
  return false;
}
function initializeCoreMod(){
  return {
    'eightfold_connector_registry_keys':{
      target:{type:'CLASS',name:'dev.mellowb.psieightfold.compat.EightfoldConnectorRouter'},
      transformer:function(c){
        // Psionic Utilities creates connector pieces with their constructors directly.
        // Psi's SpellPieceType normally assigns registryKey, so constructor-created pieces
        // otherwise retain null and crash SpellPieceRenderer as soon as they are drawn.
        for(var i=0;i<c.methods.size();i++){
          var m=c.methods.get(i);
          if(m.name!=='insert') continue;

          // Dragging can briefly report coordinates just outside Psi's 9x9 grid
          // while the mouse crosses the programmer boundary. Never index gridData
          // for those transient coordinates.
          var guard=new (Java.type('org.objectweb.asm.tree.InsnList'))();
          var inBounds=new (Java.type('org.objectweb.asm.tree.LabelNode'))();
          guard.add(new VarInsnNode(Opcodes.ILOAD,1));
          guard.add(new VarInsnNode(Opcodes.ILOAD,2));
          guard.add(new MethodInsnNode(Opcodes.INVOKESTATIC,'vazkii/psi/api/spell/SpellGrid','exists','(II)Z',false));
          guard.add(new (Java.type('org.objectweb.asm.tree.JumpInsnNode'))(Opcodes.IFNE,inBounds));
          guard.add(new InsnNode(Opcodes.RETURN));
          guard.add(inBounds);
          m.instructions.insert(guard);

          for(var ins=m.instructions.getFirst();ins!=null;ins=ins.getNext()){
            if(!(ins instanceof MethodInsnNode)) continue;
            if(ins.getOpcode()!==Opcodes.INVOKESPECIAL || String(ins.name)!=='<init>') continue;
            var owner=String(ins.owner);
            var path=null;
            if(owner==='vazkii/psi/common/spell/other/PieceConnector') path='connector';
            else if(owner==='vazkii/psi/common/spell/other/PieceCrossConnector') path='cross_connector';
            else continue;

            // Constructor result is stored in the next ASTORE. Insert key assignment after it.
            var n=ins.getNext();
            while(n!=null && !(n instanceof VarInsnNode && n.getOpcode()===Opcodes.ASTORE)) n=n.getNext();
            if(n==null) continue;
            var patch=new (Java.type('org.objectweb.asm.tree.InsnList'))();
            patch.add(new VarInsnNode(Opcodes.ALOAD,n.var));
            patch.add(new (Java.type('org.objectweb.asm.tree.LdcInsnNode'))(path));
            patch.add(new MethodInsnNode(Opcodes.INVOKESTATIC,'dev/mellowb/psieightfold/compat/RegistryKeyFix','apply','(Ljava/lang/Object;Ljava/lang/String;)V',false));
            m.instructions.insert(n,patch);
          }
        }
        return c;
      }
    },
    'eightfold_psionicutilities_drag':{
      target:{type:'CLASS',name:'gdavid.psionicutilities.mixin.ProgrammerGuiMixin'},
      transformer:function(c){
        for(var i=0;i<c.methods.size();i++){
          var m=c.methods.get(i);
          if(m.name==='drawConnectorChain'&&m.desc==='(IIII)V'){
            m.instructions.clear();
            m.tryCatchBlocks.clear();
            m.localVariables=null;
            m.instructions.add(new VarInsnNode(Opcodes.ALOAD,0));
            m.instructions.add(new VarInsnNode(Opcodes.ILOAD,1));
            m.instructions.add(new VarInsnNode(Opcodes.ILOAD,2));
            m.instructions.add(new VarInsnNode(Opcodes.ILOAD,3));
            m.instructions.add(new VarInsnNode(Opcodes.ILOAD,4));
            m.instructions.add(new MethodInsnNode(Opcodes.INVOKESTATIC,'dev/mellowb/psieightfold/compat/PsionicUtilitiesBridge','draw','(Ljava/lang/Object;IIII)V',false));
            m.instructions.add(new InsnNode(Opcodes.RETURN));
            m.maxStack=5;
            m.maxLocals=5;
            break;
          }
        }
        return c;
      }
    },
    'eightfold_psionicutilities_spellpiece_compat':{
      target:{type:'CLASS',name:'gdavid.psionicutilities.mixin.SpellPieceMixin'},
      transformer:function(c){
        // Psionic Utilities 1.21-1.4 still contains render injections that
        // target methods no longer present on Psi 110's SpellPiece class.
        // Remove those obsolete injection methods. Its ProgrammerGuiMixin remains active,
        // and Eightfold replaces drawConnectorChain above for 8-way routing.
        for(var i=c.methods.size()-1;i>=0;i--){ if(isInjectionMethod(c.methods.get(i))) c.methods.remove(i); }
        return c;
      }
    },
    'eightfold_psionicutilities_connector_compat':{
      target:{type:'CLASS',name:'gdavid.psionicutilities.mixin.ConnectorMixin'},
      transformer:function(c){
        // Psi 110 moved connector rendering out of PieceConnector. Psionic Utilities
        // still wraps PieceConnector.drawSide, so every injection method in this
        // render-only mixin is obsolete. Remove them before Mixin validates targets.
        for(var i=c.methods.size()-1;i>=0;i--){
          if(isInjectionMethod(c.methods.get(i))) c.methods.remove(i);
        }
        return c;
      }
    },
    'eightfold_psionicutilities_crossconnector_compat':{
      target:{type:'CLASS',name:'gdavid.psionicutilities.mixin.CrossConnectorMixin'},
      transformer:function(c){
        // Same issue for the 4-channel Eightfold Cross Connector. Eightfold owns its
        // rendering, while Psionic Utilities' old drawSide color wrapper is obsolete.
        for(var i=c.methods.size()-1;i>=0;i--){
          if(isInjectionMethod(c.methods.get(i))) c.methods.remove(i);
        }
        return c;
      }
    },
    'eightfold_psionicutilities_catalog_compat':{
      target:{type:'CLASS',name:'gdavid.psionicutilities.mixin.CatalogMixin'},
      transformer:function(c){
        // Psionic Utilities 1.21-1.4 targets lambda$populatePanelButtons$1 for
        // its quickArg injection. In Psi 1.21.1-110 the actual spell-piece
        // placement lambda is $0. The copyFromSpell invocation and local
        // variable name piece1 are still present, so retarget the annotation
        // instead of disabling the feature.
        for(var i=0;i<c.methods.size();i++){
          var m=c.methods.get(i);
          if(m.name!=='quickArg') continue;
          var lists=[m.visibleAnnotations,m.invisibleAnnotations];
          for(var li=0;li<lists.length;li++){
            var anns=lists[li];
            if(anns==null) continue;
            for(var ai=0;ai<anns.size();ai++){
              var a=anns.get(ai);
              if(String(a.desc)!=='Lorg/spongepowered/asm/mixin/injection/Inject;' || a.values==null) continue;
              for(var vi=0;vi<a.values.size()-1;vi+=2){
                if(String(a.values.get(vi))!=='method') continue;
                var methods=a.values.get(vi+1);
                for(var mi=0;mi<methods.size();mi++){
                  if(String(methods.get(mi))==='lambda$populatePanelButtons$1'){
                    methods.set(mi,'lambda$populatePanelButtons$0');
                  }
                }
              }
            }
          }
        }
        return c;
      }
    }
  };
}
